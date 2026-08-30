import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/memberAuth";
import { memberToPerson } from "@/lib/memberMap";
import { purgeLegacySeedMembers } from "@/lib/legacySeed";

/** List real members for The Room. */
export async function GET() {
  try {
    await purgeLegacySeedMembers();
    const me = await getCurrentMember();

    let blocked = new Set<string>();
    if (me) {
      const rows = await prisma.block.findMany({
        where: {
          OR: [{ blockerId: me.id }, { blockedId: me.id }],
        },
        select: { blockerId: true, blockedId: true },
      });
      blocked = new Set(
        rows.flatMap((r) =>
          r.blockerId === me.id ? [r.blockedId] : [r.blockerId]
        )
      );
    }

    const rows = await prisma.member.findMany({
      where: me ? { id: { not: me.id } } : undefined,
      orderBy: { updatedAt: "desc" },
      take: 200,
    });

    const members = rows
      .filter((m) => !blocked.has(m.id))
      .map(memberToPerson);

    return NextResponse.json({
      ok: true,
      members,
      meId: me?.id || null,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Failed to load members" },
      { status: 500 }
    );
  }
}
