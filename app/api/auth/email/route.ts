import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  clearAuthFailures,
  isAuthLocked,
  recordAuthFailure,
} from "@/lib/authLockout";
import { sendWelcomeEmail } from "@/lib/email";
import { ensureDemoOwner, matchesDemoOwner } from "@/lib/ensureDemoOwner";
import { demoOwnerLoginAllowed } from "@/lib/demoOwnerServer";
import { withMemberCookie } from "@/lib/memberAuth";
import { memberToProfile } from "@/lib/memberMap";
import {
  hashPassword,
  passwordNeedsUpgrade,
  verifyPassword,
} from "@/lib/password";
import { purgeDemoResidue } from "@/lib/purgeDemo";
import { rateLimit } from "@/lib/rateLimit";
import { publicError } from "@/lib/safeError";
import { sanitizeName } from "@/lib/sanitize";
import { appUrl, withSession } from "@/lib/session";
import { demoOwnerAuthSchema, emailAuthSchema } from "@/lib/validation/auth";
import { clientIp, parseBody } from "@/lib/validation/parse";

export async function POST(req: Request) {
  try {
    const limited = rateLimit(req, { name: "auth-email", limit: 20, windowMs: 60_000 });
    if (!limited.ok) return limited.response;

    await purgeDemoResidue();
    const ip = clientIp(req);

    // Peek mode without full parse for demo-owner
    const peek = await req.clone().json().catch(() => ({} as { mode?: string }));
    if (peek?.mode === "demo-owner") {
      if (!demoOwnerLoginAllowed()) {
        return NextResponse.json(
          { ok: false, error: "Demo owner sign-in is disabled on this site." },
          { status: 403 }
        );
      }
      const parsed = await parseBody(req, demoOwnerAuthSchema);
      if (!parsed.ok) return parsed.response;
      const member = await ensureDemoOwner();
      const res = NextResponse.json({
        ok: true,
        next: "/discover",
        memberId: member.id,
        demoOwner: true,
        profile: memberToProfile(member),
      });
      withSession(res, {
        id: member.id,
        name: member.name,
        email: member.email || undefined,
        picture: member.photo || undefined,
        provider: "email",
      });
      return withMemberCookie(res, member.id);
    }

    const parsed = await parseBody(req, emailAuthSchema);
    if (!parsed.ok) return parsed.response;

    const { email, password, name: rawName } = parsed.data;
    const mode = parsed.data.mode === "signup" ? "signup" : "signin";

    if (isAuthLocked(email, ip)) {
      return NextResponse.json(
        { ok: false, error: "Too many failed attempts. Try again in 15 minutes." },
        { status: 429 }
      );
    }

    if (demoOwnerLoginAllowed() && matchesDemoOwner(email, password)) {
      clearAuthFailures(email, ip);
      const member = await ensureDemoOwner();
      const res = NextResponse.json({
        ok: true,
        next: "/discover",
        memberId: member.id,
        demoOwner: true,
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
    }

    const existing = await prisma.member.findFirst({ where: { email } });

    if (mode === "signup") {
      if (existing?.passwordHash) {
        return NextResponse.json(
          { ok: false, error: "An account with that email already exists. Sign in instead." },
          { status: 409 }
        );
      }
      const name =
        sanitizeName(rawName || "") || sanitizeName(email.split("@")[0] || "Member") || "Member";
      const member = existing
        ? await prisma.member.update({
            where: { id: existing.id },
            data: { passwordHash: hashPassword(password), name: existing.name || name },
          })
        : await prisma.member.create({
            data: {
              email,
              name,
              passwordHash: hashPassword(password),
            },
          });

      if (!existing) {
        void sendWelcomeEmail(email, member.name);
      }

      clearAuthFailures(email, ip);
      const res = NextResponse.json({
        ok: true,
        next: existing?.jobTitle ? "/discover" : "/onboarding",
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

    if (!existing?.passwordHash || !verifyPassword(password, existing.passwordHash)) {
      recordAuthFailure(email, ip);
      return NextResponse.json(
        { ok: false, error: "Email or password is incorrect." },
        { status: 401 }
      );
    }

    clearAuthFailures(email, ip);

    // Upgrade legacy password hashes on successful login
    if (passwordNeedsUpgrade(existing.passwordHash)) {
      await prisma.member.update({
        where: { id: existing.id },
        data: { passwordHash: hashPassword(password) },
      });
    }

    const next = existing.jobTitle && existing.photo ? "/discover" : "/onboarding";
    const res = NextResponse.json({
      ok: true,
      next,
      memberId: existing.id,
      profile: memberToProfile(existing),
    });
    withSession(res, {
      id: existing.id,
      name: existing.name,
      email,
      picture: existing.photo || undefined,
      provider: "email",
    });
    return withMemberCookie(res, existing.id);
  } catch (e) {
    return publicError(e, "Auth failed");
  }
}

export async function GET() {
  return NextResponse.redirect(appUrl("/login"));
}
