import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { OAUTH_IP } from "@/lib/rateCaps";
import { getCurrentMember } from "@/lib/memberAuth";
import { OAUTH_REAUTH_RETURN } from "@/lib/oauthReauth";
import {
  appUrl,
  applyOAuthStateCookie,
  appleConfigured,
  createOAuthState,
} from "@/lib/session";

export async function GET(req: NextRequest) {
  const limited = await rateLimit(req, OAUTH_IP);
  if (!limited.ok) return NextResponse.redirect(appUrl("/login?error=rate_limited"));

  if (!appleConfigured()) {
    return NextResponse.redirect(appUrl("/login?error=apple_not_configured"));
  }

  const reauth = req.nextUrl.searchParams.get("reauth") === "1";
  let next = req.nextUrl.searchParams.get("next");
  let intent: { memberId: string; provider: "apple" } | undefined;
  if (reauth) {
    const me = await getCurrentMember();
    if (!me?.appleId) {
      const dest = me ? "/profile?reauth=unavailable#delete" : "/login?error=reauth_signin";
      return NextResponse.redirect(appUrl(dest));
    }
    next = OAUTH_REAUTH_RETURN;
    intent = { memberId: me.id, provider: "apple" };
  }
  const { state, nonce, cookieValue } = await createOAuthState(next, intent);
  const params = new URLSearchParams({
    client_id: process.env.APPLE_CLIENT_ID!.trim(),
    redirect_uri: appUrl("/api/auth/apple/callback"),
    response_type: "code",
    response_mode: "form_post",
    scope: "name email",
    state,
    nonce,
  });

  const res = NextResponse.redirect(`https://appleid.apple.com/auth/authorize?${params.toString()}`);
  return applyOAuthStateCookie(res, cookieValue);
}
