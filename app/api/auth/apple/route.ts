import { NextResponse } from "next/server";
import {
  appUrl,
  applyOAuthStateCookie,
  appleConfigured,
  createOAuthState,
} from "@/lib/session";

export async function GET() {
  if (!appleConfigured()) {
    return NextResponse.redirect(appUrl("/login?error=apple_not_configured"));
  }

  const { state, cookieValue } = await createOAuthState();
  const params = new URLSearchParams({
    client_id: process.env.APPLE_CLIENT_ID!.trim(),
    redirect_uri: appUrl("/api/auth/apple/callback"),
    response_type: "code",
    response_mode: "form_post",
    scope: "name email",
    state,
  });

  const res = NextResponse.redirect(`https://appleid.apple.com/auth/authorize?${params.toString()}`);
  return applyOAuthStateCookie(res, cookieValue);
}
