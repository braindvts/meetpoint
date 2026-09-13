import { timingSafeEqual } from "crypto";

export const WALKTHROUGH_OWNER_GATE = "ENABLE_WALKTHROUGH_OWNER";
export const WALKTHROUGH_OWNER_EMAIL = "WALKTHROUGH_OWNER_EMAIL";
export const WALKTHROUGH_OWNER_PASSWORD = "WALKTHROUGH_OWNER_PASSWORD";

type Env = Record<string, string | undefined>;

function envString(env: Env, key: string): string {
  return env[key] ?? "";
}

export function walkthroughOwnerEnabled(env: Env = process.env): boolean {
  return envString(env, WALKTHROUGH_OWNER_GATE).trim() === "1";
}

export function walkthroughOwnerCredentials(
  env: Env = process.env
): { email: string; password: string } | null {
  if (!walkthroughOwnerEnabled(env)) return null;
  const email = envString(env, WALKTHROUGH_OWNER_EMAIL).trim().toLowerCase();
  const password = envString(env, WALKTHROUGH_OWNER_PASSWORD);
  if (!email || !email.includes("@") || password.length < 8) return null;
  return { email, password };
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/** True only when the server-only gate is on and env credentials match. */
export function matchesWalkthroughOwner(
  email: string,
  password: string,
  env: Env = process.env
): boolean {
  const creds = walkthroughOwnerCredentials(env);
  if (!creds) return false;
  return (
    safeEqual(email.trim().toLowerCase(), creds.email) && safeEqual(password, creds.password)
  );
}
