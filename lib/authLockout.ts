/**
 * Failed-login lockout (best-effort per serverless isolate).
 * After N failures, block that email+IP for a cooldown window.
 */

type Row = { fails: number; lockedUntil: number };

const store = new Map<string, Row>();

const MAX_FAILS = 8;
const WINDOW_MS = 15 * 60_000;

export function isAuthLocked(email: string, ip: string): boolean {
  const key = `${ip}:${email.toLowerCase()}`;
  const row = store.get(key);
  if (!row) return false;
  if (Date.now() < row.lockedUntil) return true;
  if (Date.now() - (row.lockedUntil - WINDOW_MS) > WINDOW_MS) {
    store.delete(key);
  }
  return false;
}

export function recordAuthFailure(email: string, ip: string): void {
  const key = `${ip}:${email.toLowerCase()}`;
  const now = Date.now();
  const row = store.get(key) || { fails: 0, lockedUntil: 0 };
  if (now < row.lockedUntil) return;
  row.fails += 1;
  if (row.fails >= MAX_FAILS) {
    row.lockedUntil = now + WINDOW_MS;
    row.fails = 0;
  }
  store.set(key, row);
}

export function clearAuthFailures(email: string, ip: string): void {
  store.delete(`${ip}:${email.toLowerCase()}`);
}
