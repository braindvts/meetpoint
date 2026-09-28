import { NextResponse } from "next/server";
import { clearMemberCookie } from "@/lib/memberAuth";
import { signOutStepScript } from "@/lib/onboardingSession";
import { clearSession } from "@/lib/session";

export async function POST() {
  await clearSession();
  await clearMemberCookie();
  return NextResponse.json({ ok: true });
}

/** HTML so the browser can drop the saved setup step before the next person lands. */
export async function GET() {
  await clearSession();
  await clearMemberCookie();
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Signing out</title></head><body><script>${signOutStepScript()};location.replace("/")</script></body></html>`;
  return new NextResponse(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
