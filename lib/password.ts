import { createHash, randomBytes, timingSafeEqual } from "crypto";

export function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString("hex");
  const digest = createHash("sha256").update(`${salt}:${plain}`).digest("hex");
  return `${salt}:${digest}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  const i = stored.indexOf(":");
  if (i < 0) return false;
  const salt = stored.slice(0, i);
  const digest = stored.slice(i + 1);
  const next = createHash("sha256").update(`${salt}:${plain}`).digest("hex");
  try {
    const a = Buffer.from(digest);
    const b = Buffer.from(next);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
