import { NextResponse } from "next/server";
import {
  appUrl,
  applyOAuthStateCookie,
  createOAuthState,
  googleConfigured,
} from "@/lib/session";

export async function GET() {
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
