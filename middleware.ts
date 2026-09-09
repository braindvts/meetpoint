import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function appOrigin(): string | null {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

function isAllowedOrigin(origin: string, allowed: string): boolean {
  if (origin === allowed) return true;
  // Vercel preview deployments
  try {
    const host = new URL(origin).hostname;
    if (host.endsWith(".vercel.app")) return true;
    if (host === "localhost" || host === "127.0.0.1") return process.env.NODE_ENV !== "production";
  } catch {
    return false;
  }
  return false;
}

/**
 * Edge middleware:
 * - CSRF: mutating /api/* must send a matching Origin/Referer (except OAuth callbacks)
 * - Block obvious probe paths
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method.toUpperCase();

  // Probe / scanner noise
  if (
    pathname.startsWith("/.env") ||
    pathname.startsWith("/wp-") ||
    pathname === "/xmlrpc.php" ||
    pathname.startsWith("/.git")
  ) {
    return new NextResponse(null, { status: 404 });
  }

  const isApi = pathname.startsWith("/api/");
  const isOAuthCallback =
    pathname.includes("/api/auth/") && pathname.includes("/callback");
  const isHealth = pathname === "/api/health";

  if (isApi && MUTATING.has(method) && !isOAuthCallback && !isHealth) {
    const allowed = appOrigin();
    if (allowed && process.env.NODE_ENV === "production") {
      const origin = req.headers.get("origin");
      const referer = req.headers.get("referer");
      let ok = false;
      if (origin && isAllowedOrigin(origin, allowed)) ok = true;
      if (!ok && referer) {
        try {
          ok = isAllowedOrigin(new URL(referer).origin, allowed);
        } catch {
          ok = false;
        }
      }
      // Same-site navigations sometimes omit Origin on GET; for POST browsers send it.
      // Allow server-to-server with admin/notify secrets (checked in route).
      const hasServiceAuth =
        !!req.headers.get("authorization") ||
        !!req.headers.get("x-admin-secret") ||
        !!req.headers.get("x-conclave-notify");
      if (!ok && !hasServiceAuth) {
        return NextResponse.json(
          { ok: false, error: "Forbidden origin" },
          { status: 403 }
        );
      }
    }
  }

  const res = NextResponse.next();
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), payment=(self), geolocation=(self)"
  );
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
