/**
 * Failed-login lockout.
 * The tight lock is email+IP together, so one person who knows an address
 * cannot lock the account out from every network.
 * A much higher account-wide ceiling still stops a distributed password spray.
 * The walkthrough owner mailbox is exempt from that account-wide ceiling.
 */

import { isWalkthroughOwnerEmail } from "@/lib/walkthroughOwner";

type Row = { fails: number; windowStart: number; lockedUntil: number };

const store = new Map<string, Row>();

export const AUTH_LOCK_PAIR_FAILS = 8;
export const AUTH_LOCK_ACCOUNT_FAILS = 100;
export const AUTH_LOCK_WINDOW_MS = 15 * 60_000;

function pairKey(email: string, ip: string): string {
  return `pair:${ip}:${email.trim().toLowerCase()}`;
}

function accountKey(email: string): string {
  return `acct:${email.trim().toLowerCase()}`;
}

function readRow(key: string, now: number): Row | null {
  const row = store.get(key);
  if (!row) return null;
  if (row.lockedUntil && now >= row.lockedUntil) {
    store.delete(key);
    return null;
  }
  if (!row.lockedUntil && now - row.windowStart >= AUTH_LOCK_WINDOW_MS) {
    store.delete(key);
    return null;
  }
  return row;
}

function addFail(key: string, maxFails: number, now: number): void {
  let row = readRow(key, now);
  if (row?.lockedUntil && now < row.lockedUntil) return;
  if (!row) row = { fails: 0, windowStart: now, lockedUntil: 0 };
  row.fails += 1;
  if (row.fails >= maxFails) {
    row.lockedUntil = now + AUTH_LOCK_WINDOW_MS;
    row.fails = 0;
  }
  store.set(key, row);
}

export function isAuthLocked(email: string, ip: string, now = Date.now()): boolean {
  const pair = readRow(pairKey(email, ip), now);
  if (pair?.lockedUntil && now < pair.lockedUntil) return true;
  if (isWalkthroughOwnerEmail(email)) return false;
  const account = readRow(accountKey(email), now);
  return !!(account?.lockedUntil && now < account.lockedUntil);
}

export function recordAuthFailure(email: string, ip: string, now = Date.now()): void {
  addFail(pairKey(email, ip), AUTH_LOCK_PAIR_FAILS, now);
  if (isWalkthroughOwnerEmail(email)) return;
  addFail(accountKey(email), AUTH_LOCK_ACCOUNT_FAILS, now);
}

export function clearAuthFailures(email: string, ip: string): void {
  store.delete(pairKey(email, ip));
  store.delete(accountKey(email));
}

export function resetAuthLockoutForTests(): void {
  store.clear();
}
