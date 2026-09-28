import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { OAUTH_IP } from "@/lib/rateCaps";
import { getCurrentMember } from "@/lib/memberAuth";
import { OAUTH_REAUTH_RETURN } from "@/lib/oauthReauth";
import {
  appUrl,
  applyOAuthStateCookie,
  applyReauthBindCookie,
  createOAuthState,
  googleConfigured,
} from "@/lib/session";

export async function GET(req: NextRequest) {
  const limited = await rateLimit(req, OAUTH_IP);
  if (!limited.ok) return NextResponse.redirect(appUrl("/login?error=rate_limited"));

  if (!googleConfigured()) {
    return NextResponse.redirect(appUrl("/login?error=google_not_configured"));
  }

  const reauth = req.nextUrl.searchParams.get("reauth") === "1";
  let next = req.nextUrl.searchParams.get("next");
  let intent: { memberId: string; provider: "google" } | undefined;
  if (reauth) {
    const me = await getCurrentMember();
    if (!me?.googleId) {
      const dest = me ? "/profile?reauth=unavailable#delete" : "/login?error=reauth_signin";
      return NextResponse.redirect(appUrl(dest));
    }
    next = OAUTH_REAUTH_RETURN;
    intent = { memberId: me.id, provider: "google" };
  }
  const { state, nonce, cookieValue } = await createOAuthState(next, intent);
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!.trim(),
    redirect_uri: appUrl("/api/auth/google/callback"),
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: reauth ? "login" : "select_account",
  });
  if (reauth) {
    params.set("nonce", nonce);
    params.set("max_age", "0");
  }

  const res = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
  applyOAuthStateCookie(res, cookieValue);
  if (intent) applyReauthBindCookie(res, intent.memberId, nonce);
  return res;
}
