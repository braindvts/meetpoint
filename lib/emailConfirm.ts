import { createHash, randomBytes, timingSafeEqual } from "crypto";

/** Confirmation links stop working after this. */
export const EMAIL_CONFIRM_TTL_MS = 24 * 60 * 60 * 1000;

export const EMAIL_CONFIRM_UNCONFIGURED =
  "[interlink email] RESEND_API_KEY is not set. Account confirmation was not sent. Set RESEND_API_KEY and EMAIL_FROM.";

export function normalizeAccountEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function hashEmailToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function newEmailToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("base64url");
  return { raw, hash: hashEmailToken(raw) };
}

export function hashesMatch(left: string, right: string): boolean {
  try {
    const a = Buffer.from(left);
    const b = Buffer.from(right);
    return a.length === b.length && a.length > 0 && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export interface EmailTokenRow {
  memberId: string;
  email: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
}

export function emailTokenDecision(
  row: EmailTokenRow | null,
  hash: string,
  now = new Date()
): { ok: true; memberId: string; email: string } | { ok: false; error: string } {
  if (!row || !hashesMatch(row.tokenHash, hash)) {
    return { ok: false, error: "This confirmation link is invalid." };
  }
  if (row.usedAt) {
    return { ok: false, error: "This confirmation link was already used." };
  }
  if (!(row.expiresAt instanceof Date) || row.expiresAt.getTime() <= now.getTime()) {
    return { ok: false, error: "This confirmation link has expired." };
  }
  const email = normalizeAccountEmail(row.email);
  if (!email || !row.memberId) {
    return { ok: false, error: "This confirmation link is invalid." };
  }
  return { ok: true, memberId: row.memberId, email };
}

/** send = Resend is configured. dev-link = print the link locally. skip = production without a key. */
export function confirmationMailPlan(env: {
  RESEND_API_KEY?: string;
  NODE_ENV?: string;
}): "send" | "dev-link" | "skip" {
  if (env.RESEND_API_KEY?.trim()) return "send";
  if ((env.NODE_ENV || "").toLowerCase() === "production") return "skip";
  return "dev-link";
}
