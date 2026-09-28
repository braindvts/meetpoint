import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rateLimit";
import { OAUTH_CALLBACK_IP } from "@/lib/rateCaps";
import { sendWelcomeEmail } from "@/lib/email";
import { verifyGoogleIdToken } from "@/lib/googleAuth";
import { withMemberCookie } from "@/lib/memberAuth";
import { purgeDemoResidue } from "@/lib/purgeDemo";
import { sanitizeName } from "@/lib/sanitize";
import { postAuthPath } from "@/lib/appPath";
import {
  appUrl,
  clearOAuthStateCookie,
  consumeOAuthChallenge,
  withSession,
} from "@/lib/session";

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
  const challenge = await consumeOAuthChallenge();
  if (!challenge || challenge.state !== state) {
    return NextResponse.redirect(appUrl("/login?error=invalid_state"));
  }

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
      console.error("Google token error", tokenRes.status);
      return NextResponse.redirect(appUrl("/login?error=token_failed"));
    }
    const token = (await tokenRes.json()) as {
      access_token?: string;
      id_token?: string;
    };

    let user: { sub: string; name?: string; email?: string; picture?: string };

    if (token.id_token) {
      user = await verifyGoogleIdToken(token.id_token);
    } else if (token.access_token) {
      const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${token.access_token}` },
      });
      if (!profileRes.ok) {
        return NextResponse.redirect(appUrl("/login?error=profile_failed"));
      }
      const raw = (await profileRes.json()) as {
        sub?: string;
        name?: string;
        email?: string;
        email_verified?: boolean;
        picture?: string;
      };
      if (!raw.sub) {
        return NextResponse.redirect(appUrl("/login?error=profile_failed"));
      }
      user = {
        sub: raw.sub,
        name: raw.name,
        picture: raw.picture,
        email: raw.email_verified === true ? raw.email : undefined,
      };
    } else {
      return NextResponse.redirect(appUrl("/login?error=token_failed"));
    }

    const email = user.email?.toLowerCase() || null;
    const displayName = sanitizeName(user.name || "Member") || "Member";
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
          name: member.name || displayName,
        },
      });
    } else {
      member = await prisma.member.create({
        data: {
          googleId: user.sub,
          email,
          name: displayName,
          photo: user.picture || "",
        },
      });
      if (email) void sendWelcomeEmail(email, member.name);
    }

    const next = postAuthPath({
      requested: challenge.next,
      hasIdentity: !!(member.name?.trim() && member.jobTitle?.trim()),
      incomplete: "/onboarding?google=1",
    });
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
