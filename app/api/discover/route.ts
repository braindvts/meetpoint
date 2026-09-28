import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/memberAuth";
import { memberToPerson } from "@/lib/memberMap";
import { blackConnectionCounts } from "@/lib/blackServer";
import { discoverExcludedIds } from "@/lib/moderation";
import { DISCOVER_RESULT_CAP, discoverMemberSelect, type DiscoverMember } from "@/lib/discoverSelect";
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
 * The candidate scan walks the full real-member pool and selects only the
 * columns ranking and the public card need. The JSON body is the top
 * DISCOVER_RESULT_CAP matches, not the rest of the ranked list.
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
      select: discoverMemberSelect,
    });
    if (!viewer) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const excluded = await discoverExcludedIds(viewer.id);
    const people: DiscoverMember[] = [];
    let batchCursor: string | undefined;
    for (;;) {
      const batch = await prisma.member.findMany({
        where: {
          AND: [{ id: { notIn: excluded } }, { NOT: sampleMemberWhere() }],
        },
        select: discoverMemberSelect,
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
    const viewerCard = memberToPerson(viewer);

    const ranked = rankPeople(
      {
        id: viewer.id,
        jobTitle: viewerCard.jobTitle,
        company: viewerCard.company,
        industry: viewerCard.industry,
        bio: viewerCard.bio,
        lookingFor: viewerCard.lookingFor,
        interests: viewerCard.ideaTags,
        city: viewerCard.city,
      },
      visible.map((row) => {
        const person = memberToPerson(row);
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

    const top = ranked.slice(0, DISCOVER_RESULT_CAP);
    const counts = await blackConnectionCounts(top.map((row) => row.person.id || ""));

    return NextResponse.json({
      ok: true,
      meId: viewer.id,
      limit: DISCOVER_RESULT_CAP,
      nextCursor: null,
      matches: top.map((row) => ({
        person: {
          ...row.person.person,
          blackConnections: counts[row.person.id || ""] || 0,
        },
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
