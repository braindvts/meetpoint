/** Demo entry button: on in development unless forced off; off in production unless forced on. */
export function demoEntryEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_ENABLE_DEMO === "1") return true;
  if (process.env.NEXT_PUBLIC_ENABLE_DEMO === "0") return false;
  return process.env.NODE_ENV !== "production";
}

/**
 * Fake seed profiles in The Room.
 * Off by default — only when NEXT_PUBLIC_ENABLE_DEMO_PROFILES=1.
 */
export function demoProfilesEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_DEMO_PROFILES === "1";
}
