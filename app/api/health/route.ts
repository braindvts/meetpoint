import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

/**
 * Launch readiness. Public response is minimal so visitors can’t map your stack.
 * Full checklist requires ADMIN_SECRET: GET /api/health?detail=1 with Bearer.
 */
export async function GET(req: Request) {
  const has = (k: string) => !!process.env[k]?.trim();
  const canRun = has("NEXT_PUBLIC_APP_URL") && has("DATABASE_URL") && has("AUTH_SECRET");

  const url = new URL(req.url);
  if (url.searchParams.get("detail") === "1") {
    const auth = requireAdmin(req);
    if (!auth.ok) return auth.response;

    const checks = {
      appUrl: has("NEXT_PUBLIC_APP_URL"),
      database: has("DATABASE_URL"),
      authSecret: has("AUTH_SECRET"),
      email: has("RESEND_API_KEY"),
      emailFrom: has("EMAIL_FROM"),
      google: has("GOOGLE_CLIENT_ID") && has("GOOGLE_CLIENT_SECRET"),
      linkedIn: has("LINKEDIN_CLIENT_ID") && has("LINKEDIN_CLIENT_SECRET"),
      apple: has("APPLE_CLIENT_ID") && has("APPLE_CLIENT_SECRET"),
      stripe: has("STRIPE_SECRET_KEY"),
      googlePlaces: has("GOOGLE_PLACES_API_KEY"),
      twilio:
        has("TWILIO_ACCOUNT_SID") &&
        has("TWILIO_AUTH_TOKEN") &&
        has("TWILIO_FROM_NUMBER"),
      adminSecret: has("ADMIN_SECRET"),
      walkthroughOwner: has("ENABLE_WALKTHROUGH_OWNER"),
    };

    return NextResponse.json({
      ok: true,
      checks,
      canRun,
      canSignInWithSocial: checks.google || checks.linkedIn || checks.apple,
      canEmailMembers: checks.email,
      canTakePayments: canRun && checks.stripe,
      canSearchRestaurants: checks.googlePlaces,
      canTextBookings: checks.twilio,
      launchReady: canRun && (checks.google || checks.linkedIn || checks.apple) && checks.email && checks.stripe,
    });
  }

  return NextResponse.json({
    ok: true,
    status: canRun ? "up" : "misconfigured",
  });
}
