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

export type AdminOauthIdentity = {
  googleId: string | null;
  appleId: string | null;
  /** Email from the current Google sign-in. Never Member.email. */
  googleEmail: string | null;
  /** Email from the current Apple sign-in. Never Member.email. */
  appleEmail: string | null;
};

/**
 * Provider email for the ADMIN_EMAILS check.
 *
 * Member has no column for the address Google or Apple attested. OAuth writes
 * that address into Member.email only when the token includes one, and a later
 * sign-in can leave the account email in place (`email || member.email`). The
 * session cookie is the copy from this sign-in. It counts only when the
 * session provider is Google or Apple and session.id is that member's
 * googleId or appleId.
 *
 * Member.email and emailVerifiedAt are ignored. emailVerifiedAt is set by
 * POST /api/verify with no mailbox confirmation.
 */
export function adminIdentityFromAuth(
  member: {
    /** Present on Member, and ignored. Account email is not provider proof. */
    email?: string | null;
    /** Set by POST /api/verify. Ignored: that route does not confirm the mailbox. */
    emailVerifiedAt?: string | null;
    googleId?: string | null;
    appleId?: string | null;
  } | null,
  session: {
    id?: string | null;
    email?: string | null;
    provider?: string | null;
  } | null
): AdminOauthIdentity {
  const googleId = member?.googleId?.trim() || null;
  const appleId = member?.appleId?.trim() || null;
  const sessionId = session?.id?.trim() || "";
  const providerEmail = session?.email?.trim() || null;
  return {
    googleId,
    appleId,
    googleEmail:
      session?.provider === "google" && googleId && sessionId === googleId ? providerEmail : null,
    appleEmail:
      session?.provider === "apple" && appleId && sessionId === appleId ? providerEmail : null,
  };
}

function listedProviderEmail(
  providerId: string | null,
  providerEmail: string | null,
  allow: Set<string>
): boolean {
  const email = providerEmail?.trim().toLowerCase() || "";
  return Boolean(providerId && email && allow.has(email));
}

/**
 * Page gate for /admin/analytics (and later the report review queue).
 *
 * Allowed when either:
 * - the member has a Google or Apple id, and the email from that provider on
 *   this sign-in is listed in ADMIN_EMAILS, or
 * - the browser holds a cookie signed with the existing ADMIN_SECRET.
 *
 * Anything else, including a listed Member.email or emailVerifiedAt, falls
 * through to the secret. Callers must 404 when this returns false.
 */
export function canViewAdminDashboard(input: {
  googleId?: string | null;
  appleId?: string | null;
  googleEmail?: string | null;
  appleEmail?: string | null;
  cookie?: string | null;
  adminEmails?: string | null;
  adminSecret?: string | null;
  now?: number;
}): boolean {
  const now = input.now ?? Date.now();
  const allow = parseAdminEmails(input.adminEmails);
  const googleId = input.googleId?.trim() || null;
  const appleId = input.appleId?.trim() || null;
  if (
    listedProviderEmail(googleId, input.googleEmail ?? null, allow) ||
    listedProviderEmail(appleId, input.appleEmail ?? null, allow)
  ) {
    return true;
  }
  return adminCookieValid(input.cookie, input.adminSecret, now);
}
