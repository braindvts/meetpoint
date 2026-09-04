import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/memberAuth";
import { blackConnectionLevel } from "@/lib/black";
import {
  blackConnectionCount,
  isVerified,
  memberProfileStrength,
  memberQualifiesForEarnedBlack,
} from "@/lib/blackServer";
import { purgeDemoResidue } from "@/lib/purgeDemo";

/** My BLACK standing, my BLACK CONNECTION count, and any invitations waiting. */
export async function GET() {
  try {
    await purgeDemoResidue();
    const me = await getCurrentMember();
    if (!me) return NextResponse.json({ ok: false, error: "Sign in first" }, { status: 401 });

    const [count, invites] = await Promise.all([
      blackConnectionCount(me.id),
      prisma.blackInvite.findMany({
        where: { OR: [{ toId: me.id }, { fromId: me.id }] },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    return NextResponse.json({
      ok: true,
      black: me.black,
      blackSince: me.blackSince,
      blackSource: me.blackSource,
      verified: isVerified(me),
      profileStrength: memberProfileStrength(me),
      meetingsAttended: me.meetingsAttended,
      qualifiesForEarnedBlack: memberQualifiesForEarnedBlack(me),
      blackConnections: blackConnectionLevel(count),
      invites: invites.map((i) => ({
        id: i.id,
        kind: i.kind,
        status: i.status,
        chatId: i.chatId,
        direction: i.toId === me.id ? "in" : "out",
        peerId: i.toId === me.id ? i.fromId : i.toId,
        createdAt: i.createdAt,
      })),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
