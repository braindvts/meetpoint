import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import {
  appUrl,
  applyOAuthStateCookie,
  createOAuthState,
  linkedInConfigured,
} from "@/lib/session";

export async function GET(req: Request) {
  const limited = await rateLimit(req, { name: "auth-oauth", limit: 30, windowMs: 60 * 60_000 });
  if (!limited.ok) return NextResponse.redirect(appUrl("/login?error=rate_limited"));

  if (!linkedInConfigured()) {
    return NextResponse.redirect(appUrl("/login?error=not_configured"));
  }

  const { state, cookieValue } = await createOAuthState();
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
  return applyOAuthStateCookie(res, cookieValue);
}
