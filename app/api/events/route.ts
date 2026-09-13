import { NextResponse } from "next/server";
import { getPublishedEvents } from "@/lib/events";

/** Public catalog for /events — no Tables ranking, no waitlist. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    events: getPublishedEvents(),
  });
}
