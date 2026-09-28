import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  clearAuthFailures,
  isAuthLocked,
  recordAuthFailure,
} from "@/lib/authLockout";
import { emailSignupTaken } from "@/lib/emailSignup";
import { sendEmailConfirmation, sendWelcomeEmail } from "@/lib/email";
import { issueEmailConfirmation } from "@/lib/emailConfirmStore";
import { provisionWalkthroughOwnerIfAbsent } from "@/lib/ensureDemoOwner";
import { withMemberCookie } from "@/lib/memberAuth";
import { memberToProfile } from "@/lib/memberMap";
import {
  hashPassword,
  passwordNeedsUpgrade,
  verifyPassword,
} from "@/lib/password";
import { purgeDemoResidue } from "@/lib/purgeDemo";
import { accountKey, rateLimit } from "@/lib/rateLimit";
import { AUTH_EMAIL_IP, AUTH_SIGNUP_ACCOUNT, AUTH_SIGNUP_IP } from "@/lib/rateCaps";
import { publicError } from "@/lib/safeError";
import { sanitizeName } from "@/lib/sanitize";
import { postAuthPath } from "@/lib/appPath";
import { legalConsentStamp } from "@/lib/legal";
import { appUrl, withSession } from "@/lib/session";
import { emailAuthSchema } from "@/lib/validation/auth";
import { clientIp, parseBody } from "@/lib/validation/parse";
import { matchesWalkthroughOwner } from "@/lib/walkthroughOwner";

export async function POST(req: Request) {
  try {
    const limited = await rateLimit(req, AUTH_EMAIL_IP);
    if (!limited.ok) return limited.response;

    await purgeDemoResidue();
    const ip = clientIp(req);

    const parsed = await parseBody(req, emailAuthSchema);
    if (!parsed.ok) return parsed.response;

    const { email, password, name: rawName } = parsed.data;
    const mode = parsed.data.mode === "signup" ? "signup" : "signin";
    const acct = accountKey(email);

    if (mode === "signup") {
      const signupLimited = await rateLimit(req, AUTH_SIGNUP_IP);
      if (!signupLimited.ok) return signupLimited.response;
      const signupAccount = await rateLimit(req, {
        ...AUTH_SIGNUP_ACCOUNT,
        keyExtra: acct,
      });
      if (!signupAccount.ok) return signupAccount.response;
    }

    if (isAuthLocked(email, ip)) {
      return NextResponse.json(
        { ok: false, error: "Too many failed attempts. Try again in 15 minutes." },
        { status: 429 }
      );
    }

    const existing = await prisma.member.findFirst({ where: { email } });

    if (mode === "signup") {
      // Never attach a password to an existing row. An OAuth account with this
      // email would otherwise be taken over by anyone who can guess the address.
      if (emailSignupTaken(existing)) {
        return NextResponse.json(
          { ok: false, error: "An account with that email already exists. Sign in instead." },
          { status: 409 }
        );
      }
      const name =
        sanitizeName(rawName || "") || sanitizeName(email.split("@")[0] || "Member") || "Member";
      if (parsed.data.acceptTerms !== true || parsed.data.acceptPrivacy !== true) {
        return NextResponse.json(
          {
            ok: false,
            error: "Accept the Terms of Service and acknowledge the Privacy Policy to create an account.",
          },
          { status: 400 }
        );
      }
      const member = await prisma.member.create({
        data: {
          email,
          name,
          passwordHash: hashPassword(password),
          ...legalConsentStamp(),
        },
      });

      const issued = await issueEmailConfirmation(member.id, email);
      await sendEmailConfirmation(
        email,
        appUrl(`/verify-email?token=${encodeURIComponent(issued.raw)}`)
      );
      void sendWelcomeEmail(email, member.name);

      clearAuthFailures(email, ip);
      const res = NextResponse.json({
        ok: true,
        next: postAuthPath({
          requested: parsed.data.next,
          hasIdentity: false,
          incomplete: "/onboarding",
        }),
        memberId: member.id,
        profile: memberToProfile(member),
      });
      withSession(res, {
        id: member.id,
        name: member.name,
        email,
        provider: "email",
      });
      return withMemberCookie(res, member.id);
    }

    let member = existing;
    if (!member && matchesWalkthroughOwner(email, password)) {
      member = await provisionWalkthroughOwnerIfAbsent();
    }

    if (!member?.passwordHash || !verifyPassword(password, member.passwordHash)) {
      recordAuthFailure(email, ip);
      return NextResponse.json(
        { ok: false, error: "Email or password is incorrect." },
        { status: 401 }
      );
    }

    clearAuthFailures(email, ip);

    // Upgrade legacy password hashes on successful login
    if (passwordNeedsUpgrade(member.passwordHash)) {
      await prisma.member.update({
        where: { id: member.id },
        data: { passwordHash: hashPassword(password) },
      });
    }

    const next = postAuthPath({
      requested: parsed.data.next,
      hasIdentity: !!(member.name?.trim() && member.jobTitle?.trim()),
      incomplete: "/onboarding",
    });
    const res = NextResponse.json({
      ok: true,
      next,
      memberId: member.id,
      demoOwner: matchesWalkthroughOwner(email, password),
      profile: memberToProfile(member),
    });
    withSession(res, {
      id: member.id,
      name: member.name,
      email,
      picture: member.photo || undefined,
      provider: "email",
    });
    return withMemberCookie(res, member.id);
  } catch (e) {
    return publicError(e, "Auth failed");
  }
}

export async function GET() {
  return NextResponse.redirect(appUrl("/login"));
}
