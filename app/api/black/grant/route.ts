import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { publicError } from "@/lib/safeError";
import { prisma } from "@/lib/db";
import { clearBlack, isVerified, setBlack } from "@/lib/blackServer";
import { purgeDemoResidue } from "@/lib/purgeDemo";
import { rateLimit } from "@/lib/rateLimit";
import { blackGrantSchema } from "@/lib/validation/black";
import { parseBody } from "@/lib/validation/parse";

/**
 * Operator grant: POST { memberId, black? }
 * Auth: Authorization: Bearer <ADMIN_SECRET> (never send secret in JSON body).
 */
export async function POST(req: Request) {
  try {
    const limited = rateLimit(req, { name: "black-grant", limit: 10, windowMs: 60_000 });
    if (!limited.ok) return limited.response;

    await purgeDemoResidue();
    const auth = requireAdmin(req);
    if (!auth.ok) return auth.response;

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
    return publicError(e, "Failed");
  }
}
