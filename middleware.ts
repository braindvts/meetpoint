import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Phones / mobile browsers — not desktop Chrome/Safari/Firefox. */
function isMobileUserAgent(ua: string): boolean {
  return /Android.*Mobile|iPhone|iPod|webOS|BlackBerry|IEMobile|Opera Mini|Mobile.*Firefox|Mobile.*Safari/i.test(
    ua
  );
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Marketing home is laptop/desktop only. Mobile opens the app at login.
  if (pathname === "/") {
    const ua = req.headers.get("user-agent") || "";
    if (isMobileUserAgent(ua)) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
