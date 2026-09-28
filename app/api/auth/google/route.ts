import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { OAUTH_IP } from "@/lib/rateCaps";
import {
  appUrl,
  applyOAuthStateCookie,
  createOAuthState,
  googleConfigured,
} from "@/lib/session";

export async function GET(req: Request) {
  const limited = await rateLimit(req, OAUTH_IP);
  if (!limited.ok) return NextResponse.redirect(appUrl("/login?error=rate_limited"));

  if (!googleConfigured()) {
    return NextResponse.redirect(appUrl("/login?error=google_not_configured"));
  }

  const { state, cookieValue } = await createOAuthState();
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!.trim(),
    redirect_uri: appUrl("/api/auth/google/callback"),
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });

  const res = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
  return applyOAuthStateCookie(res, cookieValue);
}
