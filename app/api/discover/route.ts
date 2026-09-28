import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/memberAuth";
import { memberToPerson, memberToProfile } from "@/lib/memberMap";
import { blackConnectionCounts } from "@/lib/blackServer";
import { discoverExcludedIds } from "@/lib/moderation";
import { pageAfterId, memberPageQuery } from "@/lib/memberPage";
import { rankPeople } from "@/lib/peopleMatch";
import { purgeDemoResidue } from "@/lib/purgeDemo";
import { rateLimit } from "@/lib/rateLimit";
import { publicError } from "@/lib/safeError";
import { sampleMemberWhere } from "@/lib/sampleAccounts";

/**
 * Rank real members for Discover.
 * Shared interests are the strongest signal. Sample accounts are left out,
 * along with anyone discoverExcludedIds drops: blocks in either direction
 * and members auto-hidden after open reports from trusted reporters
 * (lib/moderation.ts from the safety work — verified email, finished
 * profile, or an older account). Brand-new accounts do not count.
 * The candidate scan is the full real-member pool. The JSON body is one
 * page (default 50, hard cap 100); callers follow nextCursor.
 */
export async function GET(req: Request) {
  try {
    const limited = await rateLimit(req, { name: "discover", limit: 60, windowMs: 60_000 });
    if (!limited.ok) return limited.response;

    await purgeDemoResidue();
    const me = await getCurrentMember();
    if (!me) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const viewer = await prisma.member.findUnique({
      where: { id: me.id },
      include: { interests: true },
    });
    if (!viewer) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { limit, cursor, cursorRejected } = memberPageQuery(req.url);
    if (cursorRejected) {
      return NextResponse.json({ ok: false, error: "Invalid cursor" }, { status: 400 });
    }

    const excluded = await discoverExcludedIds(viewer.id);
    const people: Prisma.MemberGetPayload<{ include: { interests: true } }>[] = [];
    let batchCursor: string | undefined;
    for (;;) {
      const batch = await prisma.member.findMany({
        where: {
          AND: [{ id: { notIn: excluded } }, { NOT: sampleMemberWhere() }],
        },
        include: { interests: true },
        orderBy: { id: "asc" },
        take: 500,
        ...(batchCursor ? { cursor: { id: batchCursor }, skip: 1 } : {}),
      });
      people.push(...batch);
      if (batch.length < 500) break;
      batchCursor = batch[batch.length - 1]?.id;
      if (!batchCursor) break;
    }

    const visible = people.filter((row) => row.name.trim());
    const counts = await blackConnectionCounts(visible.map((row) => row.id));
    const profile = memberToProfile(viewer);

    const ranked = rankPeople(
      {
        id: viewer.id,
        jobTitle: profile.jobTitle,
        company: profile.company,
        industry: profile.industry,
        bio: profile.bio,
        lookingFor: profile.lookingFor,
        interests: profile.ideaTags,
        city: profile.city,
      },
      visible.map((row) => {
        const person = {
          ...memberToPerson(row),
          blackConnections: counts[row.id] || 0,
        };
        return {
          id: person.id,
          jobTitle: person.jobTitle,
          company: person.company,
          industry: person.industry,
          bio: person.bio,
          lookingFor: person.lookingFor,
          interests: person.ideaTags,
          city: person.city,
          updatedAt: row.updatedAt,
          person,
        };
      })
    );

    const paged = pageAfterId(ranked, (row) => row.person.id || "", cursor, limit);

    return NextResponse.json({
      ok: true,
      meId: viewer.id,
      limit,
      nextCursor: paged.nextCursor,
      matches: paged.page.map((row) => ({
        person: row.person.person,
        score: row.score,
        reasons: row.reasons,
        sharedInterests: row.sharedInterests,
        intentFit: row.intentFit,
        sameIndustry: row.sameIndustry,
        sameRole: row.sameRole,
        distanceKm: Number.isFinite(row.distanceKm) ? row.distanceKm : null,
        isLocal: row.isLocal,
      })),
    });
  } catch (e) {
    return publicError(e, "Failed to rank members");
  }
}
