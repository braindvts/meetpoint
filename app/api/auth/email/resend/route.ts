import { NextResponse } from "next/server";
import { sendEmailConfirmation } from "@/lib/email";
import { issueEmailConfirmation } from "@/lib/emailConfirmStore";
import { legalConsentDenied } from "@/lib/legalGuard";
import { getCurrentMember } from "@/lib/memberAuth";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rateLimit";
import { publicError } from "@/lib/safeError";
import { appUrl } from "@/lib/session";

/** Signed-in resend. Issues a new single-use token and retires the previous one. */
export async function POST(req: Request) {
  try {
    const me = await getCurrentMember();
    if (!me) return NextResponse.json({ ok: false, error: "Sign in first." }, { status: 401 });
    const denied = legalConsentDenied(me);
    if (denied) return denied;

    const limited = rateLimit(req, {
      name: "email-confirm-resend",
      limit: 5,
      windowMs: 60 * 60_000,
      keyExtra: me.id,
    });
    if (!limited.ok) return limited.response;

    if (me.emailVerifiedAt && me.email) {
      const pending = await prisma.emailVerificationToken.findFirst({
        where: { memberId: me.id, usedAt: null, expiresAt: { gt: new Date() }, email: { not: me.email } },
        orderBy: { createdAt: "desc" },
      });
      if (!pending) {
        return NextResponse.json({ ok: true, alreadyVerified: true });
      }
    }

    const target =
      (
        await prisma.emailVerificationToken.findFirst({
          where: { memberId: me.id, usedAt: null, expiresAt: { gt: new Date() } },
          orderBy: { createdAt: "desc" },
        })
      )?.email || me.email;

    if (!target) {
      return NextResponse.json({ ok: false, error: "This account has no email to confirm." }, { status: 400 });
    }

    const issued = await issueEmailConfirmation(me.id, target);
    const link = appUrl(`/verify-email?token=${encodeURIComponent(issued.raw)}`);
    await sendEmailConfirmation(target, link);
    return NextResponse.json({ ok: true, email: target });
  } catch (e) {
    return publicError(e, "Could not resend confirmation");
  }
}
