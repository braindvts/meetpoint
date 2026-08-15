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
    stripe: has("STRIPE_SECRET_KEY"),
    googlePlaces: has("GOOGLE_PLACES_API_KEY"),
    twilio:
      has("TWILIO_ACCOUNT_SID") &&
      has("TWILIO_AUTH_TOKEN") &&
      has("TWILIO_FROM_NUMBER"),
    linkedIn: has("LINKEDIN_CLIENT_ID") && has("LINKEDIN_CLIENT_SECRET"),
  };

  const required = ["appUrl", "database", "authSecret", "stripe"] as const;
  const readyForMoney = required.every((k) => checks[k]);
  const readyForRestaurants = readyForMoney && checks.googlePlaces;
  const readyForSms = checks.twilio;

  return NextResponse.json({
    ok: true,
    checks,
    readyForMoney,
    readyForRestaurants,
    readyForSms,
    launchReady: readyForMoney && readyForRestaurants,
    tip: "See LAUNCH.md for setup steps. Add missing keys on Vercel → Settings → Environment Variables.",
  });
}
