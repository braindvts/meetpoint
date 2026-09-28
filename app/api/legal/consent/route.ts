import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { legalConsentStamp } from "@/lib/legal";
import { getCurrentMember } from "@/lib/memberAuth";
import { rateLimit } from "@/lib/rateLimit";
import { publicError } from "@/lib/safeError";
import { legalConsentSchema } from "@/lib/validation/auth";
import { parseBody } from "@/lib/validation/parse";

/** Records an explicit, unchecked-by-default acceptance of the current drafts. */
export async function POST(req: Request) {
  try {
    const limited = await rateLimit(req, { name: "legal-consent", limit: 20, windowMs: 60_000 });
    if (!limited.ok) return limited.response;

    const me = await getCurrentMember();
    if (!me) {
      return NextResponse.json({ ok: false, error: "Sign in first" }, { status: 401 });
    }

    const parsed = await parseBody(req, legalConsentSchema);
    if (!parsed.ok) return parsed.response;

    await prisma.member.update({
      where: { id: me.id },
      data: legalConsentStamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return publicError(e, "Failed to save acceptance");
  }
}
