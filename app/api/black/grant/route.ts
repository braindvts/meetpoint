import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { clearBlack, isVerified, setBlack } from "@/lib/blackServer";
import { purgeDemoResidue } from "@/lib/purgeDemo";
import { rateLimit } from "@/lib/rateLimit";
import { blackGrantSchema } from "@/lib/validation/black";
import { parseBody } from "@/lib/validation/parse";
import { timingSafeEqual } from "crypto";

function secretsMatch(got: string, expected: string): boolean {
  try {
    const a = Buffer.from(got);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Operator grant: POST { memberId, black? }
 * Auth: Authorization: Bearer <ADMIN_SECRET> (never send secret in JSON body).
 */
export async function POST(req: Request) {
  try {
    const limited = rateLimit(req, { name: "black-grant", limit: 10, windowMs: 60_000 });
    if (!limited.ok) return limited.response;

    await purgeDemoResidue();
    const admin = process.env.ADMIN_SECRET?.trim();
    if (!admin) {
      return NextResponse.json({ ok: false, error: "ADMIN_SECRET not set" }, { status: 503 });
    }

    const auth = req.headers.get("authorization") || "";
    const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
    const headerSecret = req.headers.get("x-admin-secret")?.trim() || "";
    if (!secretsMatch(bearer || headerSecret, admin)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const parsed = await parseBody(req, blackGrantSchema);
    if (!parsed.ok) return parsed.response;

    const member = await prisma.member.findUnique({ where: { id: parsed.data.memberId } });
    if (!member) {
      return NextResponse.json({ ok: false, error: "Member not found" }, { status: 404 });
    }

    const grant = parsed.data.black !== false;
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
