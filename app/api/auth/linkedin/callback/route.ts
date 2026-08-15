import { NextRequest, NextResponse } from "next/server";
import {
  appUrl,
  clearOAuthStateCookie,
  consumeOAuthState,
  withSession,
} from "@/lib/session";

interface LinkedInToken {
  access_token: string;
  expires_in: number;
  id_token?: string;
}

interface LinkedInUser {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email?: string;
}

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
  if (!ok) {
    return NextResponse.redirect(appUrl("/login?error=invalid_state"));
  }

  try {
    const redirectUri = appUrl("/api/auth/linkedin/callback");
    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: process.env.LINKEDIN_CLIENT_ID!.trim(),
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!.trim(),
      }),
    });

    if (!tokenRes.ok) {
      console.error("LinkedIn token error", await tokenRes.text());
      return NextResponse.redirect(appUrl("/login?error=token_failed"));
    }

    const token = (await tokenRes.json()) as LinkedInToken;

    const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });

    if (!profileRes.ok) {
      console.error("LinkedIn profile error", await profileRes.text());
      return NextResponse.redirect(appUrl("/login?error=profile_failed"));
    }

    const user = (await profileRes.json()) as LinkedInUser;
    const name =
      user.name ||
      [user.given_name, user.family_name].filter(Boolean).join(" ") ||
      "LinkedIn Member";

    const res = NextResponse.redirect(appUrl("/onboarding?linkedin=1"));
    clearOAuthStateCookie(res);
    return withSession(res, {
      id: user.sub,
      name,
      email: user.email,
      picture: user.picture,
      provider: "linkedin",
    });
  } catch (err) {
    console.error("LinkedIn OAuth failed", err);
    return NextResponse.redirect(appUrl("/login?error=oauth_failed"));
  }
}
