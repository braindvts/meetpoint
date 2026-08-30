import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/memberAuth";
import { memberToProfile } from "@/lib/memberMap";
import { purgeLegacySeedMembers } from "@/lib/legacySeed";

/** Redeem ELITE_INVITE_CODE to mark the current member Elite (tier 4). */
export async function POST(req: Request) {
  try {
    await purgeLegacySeedMembers();
    const me = await getCurrentMember();
    if (!me) return NextResponse.json({ ok: false, error: "Sign in first" }, { status: 401 });

    const expected = process.env.ELITE_INVITE_CODE?.trim();
    if (!expected) {
      return NextResponse.json(
        { ok: false, error: "Elite invites are not configured. Set ELITE_INVITE_CODE." },
        { status: 503 }
      );
    }

    const body = (await req.json()) as { code?: string };
    const code = String(body.code || "").trim();
    if (!code || code !== expected) {
      return NextResponse.json({ ok: false, error: "Invalid invite code" }, { status: 403 });
    }

    const updated = await prisma.member.update({
      where: { id: me.id },
      data: { elite: true },
    });

    return NextResponse.json({
      ok: true,
      elite: true,
      profile: memberToProfile(updated),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
