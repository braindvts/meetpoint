import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { legalConsentDenied } from "@/lib/legalGuard";
import { getCurrentMember } from "@/lib/memberAuth";
import { memberToPerson } from "@/lib/memberMap";
import { discoverExcludedIds } from "@/lib/moderation";
import { sampleMemberWhere } from "@/lib/sampleAccounts";
import { blackConnectionCounts } from "@/lib/blackServer";
import { memberPageQuery } from "@/lib/memberPage";
import { purgeDemoResidue } from "@/lib/purgeDemo";
import { rateLimit } from "@/lib/rateLimit";
import { publicError } from "@/lib/safeError";

/**
 * List real members for The Room — signed-in members only.
 * One response is a page (default 50, hard cap 100). Callers follow nextCursor.
 */
export async function GET(req: Request) {
  try {
    const limited = await rateLimit(req, { name: "members-list", limit: 60, windowMs: 60_000 });
    if (!limited.ok) return limited.response;

    await purgeDemoResidue();
    const me = await getCurrentMember();
    if (!me) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const denied = legalConsentDenied(me);
    if (denied) return denied;

    const { limit, cursor, cursorRejected } = memberPageQuery(req.url);
    if (cursorRejected) {
      return NextResponse.json({ ok: false, error: "Invalid cursor" }, { status: 400 });
    }

    const excluded = await discoverExcludedIds(me.id);
    let keyset: Prisma.MemberWhereInput | null = null;
    if (cursor) {
      const anchor = await prisma.member.findUnique({
        where: { id: cursor },
        select: { id: true, updatedAt: true },
      });
      if (!anchor) {
        return NextResponse.json({ ok: true, members: [], meId: me.id, nextCursor: null, limit });
      }
      keyset = {
        OR: [
          { updatedAt: { lt: anchor.updatedAt } },
          { AND: [{ updatedAt: anchor.updatedAt }, { id: { lt: anchor.id } }] },
        ],
      };
    }

    const people = await prisma.member.findMany({
      where: {
        AND: [
          { id: { notIn: excluded } },
          { deletedAt: null },
          { NOT: sampleMemberWhere() },
          ...(keyset ? [keyset] : []),
        ],
      },
      include: { interests: true },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: limit + 1,
    });

    const page = people.slice(0, limit);
    const nextCursor = people.length > limit ? page[page.length - 1]?.id ?? null : null;
    const counts = await blackConnectionCounts(page.map((m) => m.id));
    const members = page.map((m) => ({
      ...memberToPerson(m),
      blackConnections: counts[m.id] || 0,
    }));

    return NextResponse.json({
      ok: true,
      members,
      meId: me.id,
      nextCursor,
      limit,
    });
  } catch (e) {
    return publicError(e, "Failed to load members");
  }
}
