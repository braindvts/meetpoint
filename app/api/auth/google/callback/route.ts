import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withMemberCookie } from "@/lib/memberAuth";
import { purgeDemoResidue } from "@/lib/purgeDemo";
import {
  appUrl,
  clearOAuthStateCookie,
  consumeOAuthState,
  withSession,
} from "@/lib/session";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(appUrl(`/login?error=${encodeURIComponent(oauthError)}`));
  }
  if (!code || !state) {
    return NextResponse.redirect(appUrl("/login?error=missing_code"));
  }
  const ok = await consumeOAuthState(state);
  if (!ok) return NextResponse.redirect(appUrl("/login?error=invalid_state"));

  try {
    await purgeDemoResidue();
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!.trim(),
        client_secret: process.env.GOOGLE_CLIENT_SECRET!.trim(),
        redirect_uri: appUrl("/api/auth/google/callback"),
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) {
      console.error("Google token error", await tokenRes.text());
      return NextResponse.redirect(appUrl("/login?error=token_failed"));
    }
    const token = (await tokenRes.json()) as { access_token: string };
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    if (!profileRes.ok) {
      return NextResponse.redirect(appUrl("/login?error=profile_failed"));
    }
    const user = (await profileRes.json()) as {
      sub: string;
      name?: string;
      email?: string;
      picture?: string;
    };

    const email = user.email?.toLowerCase() || null;
    let member = await prisma.member.findFirst({ where: { googleId: user.sub } });
    if (!member && email) {
      member = await prisma.member.findFirst({ where: { email } });
    }
    if (member) {
      member = await prisma.member.update({
        where: { id: member.id },
        data: {
          googleId: user.sub,
          email: email || member.email,
          photo: member.photo || user.picture || "",
          name: member.name || user.name || "Member",
        },
      });
    } else {
      member = await prisma.member.create({
        data: {
          googleId: user.sub,
          email,
          name: user.name || "Member",
          photo: user.picture || "",
        },
      });
    }

    const next = member.jobTitle && member.photo ? "/discover" : "/onboarding?google=1";
    const res = NextResponse.redirect(appUrl(next));
    clearOAuthStateCookie(res);
    withSession(res, {
      id: user.sub,
      name: member.name,
      email: email || undefined,
      picture: user.picture,
      provider: "google",
    });
    return withMemberCookie(res, member.id);
  } catch (err) {
    console.error("Google OAuth failed", err);
    return NextResponse.redirect(appUrl("/login?error=oauth_failed"));
  }
}
