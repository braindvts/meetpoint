import "server-only";

import { DEMO_OWNER_EMAIL, isDemoOwnerEmail } from "./demoOwner";

/**
 * One-tap / password demo owner is opt-in only.
 * Production stays closed unless ENABLE_DEMO_OWNER=1 or NEXT_PUBLIC_ENABLE_DEMO=1
 * AND a DEMO_OWNER_PASSWORD is configured (no silent default in production).
 */
export function demoOwnerLoginAllowed(): boolean {
  const enabled =
    process.env.ENABLE_DEMO_OWNER === "1" ||
    process.env.NEXT_PUBLIC_ENABLE_DEMO === "1";
  if (!enabled) return false;
  if (process.env.NODE_ENV === "production" && !process.env.DEMO_OWNER_PASSWORD?.trim()) {
    return false;
  }
  return true;
}

/**
 * Demo owner password — server-only. Never import from client components.
 * Production requires DEMO_OWNER_PASSWORD (no hardcoded fallback).
 */
export function demoOwnerPassword(): string {
  const fromEnv = process.env.DEMO_OWNER_PASSWORD?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production") return "";
  return "Brian812";
}

export function matchesDemoOwner(email: string, password: string): boolean {
  const expected = demoOwnerPassword();
  if (!expected || !password) return false;
  return isDemoOwnerEmail(email) && password === expected;
}

export { DEMO_OWNER_EMAIL };
