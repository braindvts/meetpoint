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
 * True when this member's address is safe to trust for ADMIN_EMAILS.
 *
 * `emailVerifiedAt` is the only verification timestamp on Member. Google and
 * Apple sign-in are recorded as `googleId` / `appleId` (the provider checked
 * the address). A password signup leaves all three empty, so a listed email
 * alone is not enough.
 */
export function adminEmailIsVerified(input: {
  emailVerifiedAt?: string | null;
  googleId?: string | null;
  appleId?: string | null;
}): boolean {
  if (input.emailVerifiedAt?.trim()) return true;
  if (input.googleId?.trim()) return true;
  if (input.appleId?.trim()) return true;
  return false;
}

export function adminIdentityFromMember(
  member: {
    email?: string | null;
    emailVerifiedAt?: string | null;
    googleId?: string | null;
    appleId?: string | null;
  } | null
) {
  return {
    email: member?.email ?? null,
    emailVerifiedAt: member?.emailVerifiedAt ?? null,
    googleId: member?.googleId ?? null,
    appleId: member?.appleId ?? null,
  };
}

/**
 * Page gate for /admin/analytics (and later the report review queue).
 *
 * Allowed when either:
 * - the signed-in email is listed in ADMIN_EMAILS AND that address is verified, or
 * - the browser holds a cookie signed with the existing ADMIN_SECRET.
 *
 * An unverified listed email falls through to the secret. Callers must 404
 * when this returns false.
 */
export function canViewAdminDashboard(input: {
  email?: string | null;
  emailVerifiedAt?: string | null;
  googleId?: string | null;
  appleId?: string | null;
  cookie?: string | null;
  adminEmails?: string | null;
  adminSecret?: string | null;
  now?: number;
}): boolean {
  const now = input.now ?? Date.now();
  const allow = parseAdminEmails(input.adminEmails);
  const email = input.email?.trim().toLowerCase() || "";
  if (email && allow.has(email) && adminEmailIsVerified(input)) return true;
  return adminCookieValid(input.cookie, input.adminSecret, now);
}
