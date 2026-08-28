import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withMemberCookie } from "@/lib/memberAuth";
import { hashPassword, isValidEmail, verifyPassword } from "@/lib/password";
import { ensureSeeded } from "@/lib/seed";
import { appUrl, withSession } from "@/lib/session";

export async function POST(req: Request) {
  try {
    await ensureSeeded();
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
      if (existing?.passwordHash) {
        return NextResponse.json(
          { ok: false, error: "An account with that email already exists. Sign in instead." },
          { status: 409 }
        );
      }
      const name = String(body.name || "").trim() || email.split("@")[0];
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

      const res = NextResponse.json({
        ok: true,
        next: existing?.jobTitle ? "/discover" : "/onboarding",
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

    if (!existing?.passwordHash || !verifyPassword(password, existing.passwordHash)) {
      return NextResponse.json({ ok: false, error: "Email or password is incorrect." }, { status: 401 });
    }

    const next = existing.jobTitle && existing.photo ? "/discover" : "/onboarding";
    const res = NextResponse.json({ ok: true, next, memberId: existing.id });
    withSession(res, {
      id: existing.id,
      name: existing.name,
      email,
      picture: existing.photo || undefined,
      provider: "email",
    });
    return withMemberCookie(res, existing.id);
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
