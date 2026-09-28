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
  linkedInConfigured,
} from "@/lib/session";

export async function GET(req: NextRequest) {
  const limited = await rateLimit(req, OAUTH_IP);
  if (!limited.ok) return NextResponse.redirect(appUrl("/login?error=rate_limited"));

  if (!linkedInConfigured()) {
    return NextResponse.redirect(appUrl("/login?error=not_configured"));
  }

  const reauth = req.nextUrl.searchParams.get("reauth") === "1";
  let next = req.nextUrl.searchParams.get("next");
  let intent: { memberId: string; provider: "linkedin" } | undefined;
  if (reauth) {
    const me = await getCurrentMember();
    if (!me?.linkedInId) {
      const dest = me ? "/profile?reauth=unavailable#delete" : "/login?error=reauth_signin";
      return NextResponse.redirect(appUrl(dest));
    }
    next = OAUTH_REAUTH_RETURN;
    intent = { memberId: me.id, provider: "linkedin" };
  }
  const { state, nonce, cookieValue } = await createOAuthState(next, intent);
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.LINKEDIN_CLIENT_ID!.trim(),
    redirect_uri: appUrl("/api/auth/linkedin/callback"),
    state,
    scope: "openid profile email",
  });

  const res = NextResponse.redirect(
    `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`
  );
  applyOAuthStateCookie(res, cookieValue);
  if (intent) applyReauthBindCookie(res, intent.memberId, nonce);
  return res;
}
