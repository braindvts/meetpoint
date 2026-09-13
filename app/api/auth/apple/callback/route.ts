import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";
import { withMemberCookie } from "@/lib/memberAuth";
import { purgeDemoResidue } from "@/lib/purgeDemo";
import {
  appUrl,
  clearOAuthStateCookie,
  consumeOAuthState,
  withSession,
} from "@/lib/session";

function decodeJwtPayload(idToken: string): {
  sub?: string;
  email?: string;
} {
  const part = idToken.split(".")[1];
  if (!part) return {};
  const json = Buffer.from(part.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
  return JSON.parse(json) as { sub?: string; email?: string };
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const code = String(form.get("code") || "");
  const state = String(form.get("state") || "");
  const userRaw = String(form.get("user") || "");

  if (!code || !state) {
    return NextResponse.redirect(appUrl("/login?error=missing_code"));
  }
  const ok = await consumeOAuthState(state);
  if (!ok) return NextResponse.redirect(appUrl("/login?error=invalid_state"));

  try {
    await purgeDemoResidue();

    // Exchange the authorization code with Apple. Never trust the form-posted
    // id_token — it is not a signature we verify, and the code is single-use.
    const tokenRes = await fetch("https://appleid.apple.com/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.APPLE_CLIENT_ID!.trim(),
        client_secret: process.env.APPLE_CLIENT_SECRET!.trim(),
        code,
        grant_type: "authorization_code",
        redirect_uri: appUrl("/api/auth/apple/callback"),
      }),
    });
    if (!tokenRes.ok) {
      console.error("Apple token error", await tokenRes.text());
      return NextResponse.redirect(appUrl("/login?error=token_failed"));
    }
    const token = (await tokenRes.json()) as { id_token?: string };
    if (!token.id_token) {
      return NextResponse.redirect(appUrl("/login?error=profile_failed"));
    }

    const claims = decodeJwtPayload(token.id_token);
    const sub = claims.sub;
    if (!sub) return NextResponse.redirect(appUrl("/login?error=profile_failed"));

    let name = "Member";
    if (userRaw) {
      try {
        const parsed = JSON.parse(userRaw) as { name?: { firstName?: string; lastName?: string } };
        name = [parsed.name?.firstName, parsed.name?.lastName].filter(Boolean).join(" ") || name;
      } catch {
        /* ignore */
      }
    }

    const email = claims.email?.toLowerCase() || null;
    let member = await prisma.member.findFirst({ where: { appleId: sub } });
    if (!member && email) {
      member = await prisma.member.findFirst({ where: { email } });
    }
    if (member) {
      member = await prisma.member.update({
        where: { id: member.id },
        data: {
          appleId: sub,
          email: email || member.email,
          name: member.name && member.name !== "Member" ? member.name : name,
        },
      });
    } else {
      member = await prisma.member.create({
        data: { appleId: sub, email, name },
      });
      if (email) void sendWelcomeEmail(email, member.name);
    }

    const next = member.jobTitle && member.photo ? "/discover" : "/onboarding?apple=1";
    const res = NextResponse.redirect(appUrl(next));
    clearOAuthStateCookie(res);
    withSession(res, {
      id: sub,
      name: member.name,
      email: email || undefined,
      provider: "apple",
    });
    return withMemberCookie(res, member.id);
  } catch (err) {
    console.error("Apple OAuth failed", err);
    return NextResponse.redirect(appUrl("/login?error=oauth_failed"));
  }
}

export async function GET() {
  return NextResponse.redirect(appUrl("/login?error=oauth_failed"));
}
