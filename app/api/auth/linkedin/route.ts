import { NextResponse } from "next/server";
import {
  appUrl,
  applyOAuthStateCookie,
  createOAuthState,
  linkedInConfigured,
} from "@/lib/session";

export async function GET() {
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
