import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { postAuthPath } from "@/lib/appPath";
import { purgeDemoResidue } from "@/lib/purgeDemo";
import { rateLimit } from "@/lib/rateLimit";
import { OAUTH_CALLBACK_IP } from "@/lib/rateCaps";
import { oauthReauthResponse } from "@/lib/oauthReauthRoute";
import {
  appUrl,
  clearOAuthStateCookie,
  consumeOAuthChallenge,
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
  const limited = await rateLimit(req, OAUTH_CALLBACK_IP);
  if (!limited.ok) return NextResponse.redirect(appUrl("/login?error=rate_limited"));

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

  const challenge = await consumeOAuthChallenge(state);
  if (!challenge || challenge.state !== state) {
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

    const reauthRes = await oauthReauthResponse({
      intent: challenge.reauth,
      provider: "linkedin",
      providerSubject: user.sub,
    });
    if (reauthRes) return reauthRes;

    await purgeDemoResidue();
    const email = user.email?.toLowerCase() || null;
    // Look up an existing row only to choose the post-login page.
    // This does not write linkedInId, email, or any other field, and it
    // does not merge the LinkedIn identity into that account.
    const linked = await prisma.member.findFirst({
      where: { linkedInId: user.sub },
      select: { name: true, jobTitle: true },
    });
    const sameEmail = !linked && email
      ? await prisma.member.findFirst({
          where: { email },
          select: { name: true, jobTitle: true },
        })
      : null;
    const identitySource = linked || sameEmail;
    const dest = postAuthPath({
      requested: challenge.next,
      hasIdentity: !!(identitySource?.name?.trim() && identitySource?.jobTitle?.trim()),
      incomplete: "/onboarding?linkedin=1",
    });
    const res = NextResponse.redirect(appUrl(dest));
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
