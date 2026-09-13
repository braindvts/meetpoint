import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";
import { provisionWalkthroughOwnerIfAbsent } from "@/lib/ensureDemoOwner";
import { withMemberCookie } from "@/lib/memberAuth";
import { hashPassword, isValidEmail, verifyPassword } from "@/lib/password";
import { purgeDemoResidue } from "@/lib/purgeDemo";
import { appUrl, withSession } from "@/lib/session";
import { matchesWalkthroughOwner } from "@/lib/walkthroughOwner";

export async function POST(req: Request) {
  try {
    await purgeDemoResidue();
    const body = (await req.json()) as {
      email?: string;
      password?: string;
      name?: string;
      mode?: "signin" | "signup";
    };
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const mode = body.mode === "signup" ? "signup" : "signin";

    if (!isValidEmail(email)) {
      return NextResponse.json({ ok: false, error: "Enter a valid email." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { ok: false, error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const existing = await prisma.member.findFirst({ where: { email } });

    if (mode === "signup") {
      // Never attach a password to an existing row. An OAuth account with this
      // email would otherwise be taken over by anyone who can guess the address.
      if (existing) {
        return NextResponse.json(
          { ok: false, error: "An account with that email already exists. Sign in instead." },
          { status: 409 }
        );
      }
      const name = String(body.name || "").trim() || email.split("@")[0];
      const member = await prisma.member.create({
        data: {
          email,
          name,
          passwordHash: hashPassword(password),
        },
      });

      void sendWelcomeEmail(email, member.name);

      const res = NextResponse.json({
        ok: true,
        next: "/onboarding",
        memberId: member.id,
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
      return NextResponse.json({ ok: false, error: "Email or password is incorrect." }, { status: 401 });
    }

    const next = member.jobTitle && member.photo ? "/discover" : "/onboarding";
    const res = NextResponse.json({
      ok: true,
      next,
      memberId: member.id,
      demoOwner: matchesWalkthroughOwner(email, password),
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
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Sign-in failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.redirect(appUrl("/login"));
}
