import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/memberAuth";
import { memberToPerson } from "@/lib/memberMap";
import { blackConnectionCounts } from "@/lib/blackServer";
import { discoverExcludedIds } from "@/lib/moderation";
import { purgeDemoResidue } from "@/lib/purgeDemo";
import { rateLimit } from "@/lib/rateLimit";
import { publicError } from "@/lib/safeError";

/** List real members for The Room — signed-in members only. */
export async function GET(req: Request) {
  try {
    const limited = await rateLimit(req, { name: "members-list", limit: 60, windowMs: 60_000 });
    if (!limited.ok) return limited.response;

    await purgeDemoResidue();
    const me = await getCurrentMember();
    if (!me) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const excluded = await discoverExcludedIds(me.id);
    const people = await prisma.member.findMany({
      where: { id: { notIn: excluded } },
      orderBy: { updatedAt: "desc" },
      take: 200,
    });

    const visible = people;
    const counts = await blackConnectionCounts(visible.map((m) => m.id));
    const members = visible.map((m) => ({
      ...memberToPerson(m),
      blackConnections: counts[m.id] || 0,
    }));

    return NextResponse.json({
      ok: true,
      members,
      meId: me.id,
    });
  } catch (e) {
    return publicError(e, "Failed to load members");
  }
}
