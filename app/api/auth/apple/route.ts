import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import {
  appUrl,
  applyOAuthStateCookie,
  appleConfigured,
  createOAuthState,
} from "@/lib/session";

export async function GET(req: Request) {
  const limited = await rateLimit(req, { name: "auth-oauth", limit: 30, windowMs: 60 * 60_000 });
  if (!limited.ok) return NextResponse.redirect(appUrl("/login?error=rate_limited"));

  if (!appleConfigured()) {
    return NextResponse.redirect(appUrl("/login?error=apple_not_configured"));
  }

  const { state, nonce, cookieValue } = await createOAuthState();
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
