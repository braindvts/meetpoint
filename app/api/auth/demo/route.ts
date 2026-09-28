import { NextResponse } from "next/server";
import { demoProfilesServerEnabled } from "@/lib/demoProfiles";

/**
 * Guest entry for "Enter as Mohammed".
 * Production leaves ENABLE_DEMO_PROFILES unset, so this is a 404.
 * A preview can opt in with that server-only variable. This route does not
 * create a database member.
 */
function refuseOrOk() {
  if (!demoProfilesServerEnabled()) {
    return new NextResponse(null, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export function GET() {
  return refuseOrOk();
}

export function POST() {
  return refuseOrOk();
}
