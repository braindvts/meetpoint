/**
 * Server-only switch for sample login ("Enter as Mohammed") and /demo.
 * Default off. NEXT_PUBLIC_ENABLE_DEMO* does not turn this on.
 * Set ENABLE_DEMO_PROFILES=1 on a preview when you need the guest path.
 */
export const DEMO_PROFILES_GATE = "ENABLE_DEMO_PROFILES";

type Env = Record<string, string | undefined>;

export function demoProfilesServerEnabled(env: Env = process.env): boolean {
  return (env[DEMO_PROFILES_GATE] || "").trim() === "1";
}
