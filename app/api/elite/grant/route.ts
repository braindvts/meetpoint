import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { purgeLegacySeedMembers } from "@/lib/legacySeed";

/**
 * Admin grant Elite: POST { memberId, secret }
 * Requires ADMIN_SECRET env.
 */
export async function POST(req: Request) {
  try {
    await purgeLegacySeedMembers();
    const admin = process.env.ADMIN_SECRET?.trim();
    if (!admin) {
      return NextResponse.json({ ok: false, error: "ADMIN_SECRET not set" }, { status: 503 });
    }

    const body = (await req.json()) as { memberId?: string; secret?: string; elite?: boolean };
    if (body.secret !== admin) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const memberId = String(body.memberId || "").trim();
    if (!memberId) {
      return NextResponse.json({ ok: false, error: "memberId required" }, { status: 400 });
    }

    const updated = await prisma.member.update({
      where: { id: memberId },
      data: { elite: body.elite !== false },
    });

    return NextResponse.json({
      ok: true,
      memberId: updated.id,
      name: updated.name,
      elite: updated.elite,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
