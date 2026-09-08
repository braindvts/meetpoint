import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Website-first: every device sees the marketing home at `/`.
 * (Previously phones were bounced to /login like a native app shell.)
 */
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
