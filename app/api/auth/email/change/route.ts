import { NextResponse } from "next/server";
import { sendEmailConfirmation } from "@/lib/email";
import { normalizeAccountEmail } from "@/lib/emailConfirm";
import { issueEmailConfirmation } from "@/lib/emailConfirmStore";
import { legalConsentDenied } from "@/lib/legalGuard";
import { getCurrentMember } from "@/lib/memberAuth";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { rateLimit } from "@/lib/rateLimit";
import { publicError } from "@/lib/safeError";
import { appUrl } from "@/lib/session";
import { z } from "zod";
import { zEmail, zPassword } from "@/lib/validation/primitives";
import { parseBody } from "@/lib/validation/parse";

const changeSchema = z
  .object({
    email: zEmail,
    password: zPassword,
  })
  .strict();

/**
 * Ask to move the account email. The login address stays until the new
 * address confirms the link. Password accounts only.
 */
export async function POST(req: Request) {
  try {
    const me = await getCurrentMember();
    if (!me) return NextResponse.json({ ok: false, error: "Sign in first." }, { status: 401 });
    const denied = legalConsentDenied(me);
    if (denied) return denied;

    const limited = rateLimit(req, {
      name: "email-confirm-change",
      limit: 5,
      windowMs: 60 * 60_000,
      keyExtra: me.id,
    });
    if (!limited.ok) return limited.response;

    const parsed = await parseBody(req, changeSchema);
    if (!parsed.ok) return parsed.response;

    if (!me.passwordHash || !verifyPassword(parsed.data.password, me.passwordHash)) {
      return NextResponse.json({ ok: false, error: "Password is incorrect." }, { status: 401 });
    }

    const email = normalizeAccountEmail(parsed.data.email);
    if (email === normalizeAccountEmail(me.email || "") && me.emailVerifiedAt) {
      return NextResponse.json({ ok: true, alreadyVerified: true, email });
    }

    const taken = await prisma.member.findFirst({
      where: { email, id: { not: me.id }, deletedAt: null },
      select: { id: true },
    });
    if (taken) {
      return NextResponse.json(
        { ok: false, error: "An account with that email already exists." },
        { status: 409 }
      );
    }

    const issued = await issueEmailConfirmation(me.id, email);
    const link = appUrl(`/verify-email?token=${encodeURIComponent(issued.raw)}`);
    await sendEmailConfirmation(email, link);
    return NextResponse.json({ ok: true, email });
  } catch (e) {
    return publicError(e, "Could not start email change");
  }
}
