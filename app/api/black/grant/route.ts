import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { clearBlack, isVerified, setBlack } from "@/lib/blackServer";
import { purgeDemoResidue } from "@/lib/purgeDemo";

/**
 * Operator grant: POST { memberId, secret, black }.
 * Requires ADMIN_SECRET — members can never grant BLACK to each other.
 */
export async function POST(req: Request) {
  try {
    await purgeDemoResidue();
    const admin = process.env.ADMIN_SECRET?.trim();
    if (!admin) {
      return NextResponse.json({ ok: false, error: "ADMIN_SECRET not set" }, { status: 503 });
    }

    const body = (await req.json()) as { memberId?: string; secret?: string; black?: boolean };
    if (body.secret !== admin) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const memberId = String(body.memberId || "").trim();
    if (!memberId) {
      return NextResponse.json({ ok: false, error: "memberId required" }, { status: 400 });
    }

    const member = await prisma.member.findUnique({ where: { id: memberId } });
    if (!member) {
      return NextResponse.json({ ok: false, error: "Member not found" }, { status: 404 });
    }

    const grant = body.black !== false;
    if (grant && !isVerified(member)) {
      return NextResponse.json(
        { ok: false, error: "That member isn't verified yet, so BLACK can't be granted." },
        { status: 403 }
      );
    }

    const updated = grant ? await setBlack(member.id, "granted") : await clearBlack(member.id);

    return NextResponse.json({
      ok: true,
      memberId: updated.id,
      name: updated.name,
      black: updated.black,
      source: updated.blackSource,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
