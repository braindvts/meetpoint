import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";

const SCRYPT_PREFIX = "scrypt$";

/** Prefer scrypt; still verify legacy sha256 `salt:digest` hashes. */
export function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString("hex");
  const digest = scryptSync(plain, salt, 64).toString("hex");
  return `${SCRYPT_PREFIX}${salt}:${digest}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  try {
    if (stored.startsWith(SCRYPT_PREFIX)) {
      const rest = stored.slice(SCRYPT_PREFIX.length);
      const i = rest.indexOf(":");
      if (i < 0) return false;
      const salt = rest.slice(0, i);
      const digest = rest.slice(i + 1);
      const next = scryptSync(plain, salt, 64).toString("hex");
      const a = Buffer.from(digest, "hex");
      const b = Buffer.from(next, "hex");
      return a.length === b.length && timingSafeEqual(a, b);
    }

    // Legacy SHA-256 (salt:hex)
    const i = stored.indexOf(":");
    if (i < 0) return false;
    const salt = stored.slice(0, i);
    const digest = stored.slice(i + 1);
    const hashed = createHash("sha256").update(`${salt}:${plain}`).digest("hex");
    const a = Buffer.from(digest);
    const b = Buffer.from(hashed);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** True when a verified hash should be upgraded to scrypt on next login. */
export function passwordNeedsUpgrade(stored: string): boolean {
  return !stored.startsWith(SCRYPT_PREFIX);
}
