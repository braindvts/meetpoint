import { createHmac, timingSafeEqual } from "crypto";

/** HttpOnly cookie set after ADMIN_SECRET is checked. Path is /admin only. */
export const ADMIN_COOKIE = "interlink_admin";

/** How long an operator session from ADMIN_SECRET stays valid. */
export const ADMIN_SESSION_MS = 12 * 60 * 60 * 1000;

export function secretsMatch(got: string, expected: string): boolean {
  try {
    const a = Buffer.from(got);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function parseAdminEmails(raw: string | null | undefined): Set<string> {
  const out = new Set<string>();
  for (const part of (raw || "").split(",")) {
    const email = part.trim().toLowerCase();
    if (email) out.add(email);
  }
  return out;
}

/** Signed proof that ADMIN_SECRET was presented. The secret itself is not stored. */
export function signAdminCookie(secret: string, now = Date.now()): string {
  const exp = now + ADMIN_SESSION_MS;
  const payload = `v1.${exp}`;
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function adminCookieValid(
  token: string | null | undefined,
  secret: string | null | undefined,
  now = Date.now()
): boolean {
  const key = secret?.trim() || "";
  if (!token || !key) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [version, expRaw, sig] = parts;
  if (version !== "v1" || !expRaw || !sig) return false;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp <= now) return false;
  const payload = `${version}.${expRaw}`;
  const expected = createHmac("sha256", key).update(payload).digest("base64url");
  return secretsMatch(sig, expected);
}

export function adminCookieOptions(maxAgeSec: number) {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: maxAgeSec,
  };
}

/**
 * Page gate for /admin/analytics (and later the report review queue).
 *
 * Allowed when either:
 * - the signed-in member's email is listed in ADMIN_EMAILS, or
 * - the browser holds a cookie signed with the existing ADMIN_SECRET.
 *
 * Neither condition is a UI hide. Callers must 404 when this returns false.
 */
export function canViewAdminDashboard(input: {
  email?: string | null;
  cookie?: string | null;
  adminEmails?: string | null;
  adminSecret?: string | null;
  now?: number;
}): boolean {
  const now = input.now ?? Date.now();
  const allow = parseAdminEmails(input.adminEmails);
  const email = input.email?.trim().toLowerCase() || "";
  if (email && allow.has(email)) return true;
  return adminCookieValid(input.cookie, input.adminSecret, now);
}
