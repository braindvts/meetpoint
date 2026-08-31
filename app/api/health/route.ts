import { NextResponse } from "next/server";

/**
 * Public launch readiness check — no secrets returned.
 * Open /api/health after deploy to see what's configured.
 */
export async function GET() {
  const has = (k: string) => !!process.env[k]?.trim();

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
  };

  const canRun = checks.appUrl && checks.database && checks.authSecret;
  const canSignInWithSocial = checks.google || checks.linkedIn || checks.apple;

  return NextResponse.json({
    ok: true,
    checks,
    canRun,
    canSignInWithSocial,
    canEmailMembers: checks.email,
    canTakePayments: canRun && checks.stripe,
    canSearchRestaurants: checks.googlePlaces,
    canTextBookings: checks.twilio,
    launchReady: canRun && canSignInWithSocial && checks.email && checks.stripe,
    tip: "See KEYS.md for where to get each key. Add missing ones in your host's environment variables, then redeploy.",
  });
}
