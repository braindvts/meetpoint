/**
 * Demo mode is for looking at the app locally. Both flags default to off, so a
 * deployed Conclave only ever shows real members who signed themselves up.
 */

/** Shows "Enter demo" and enables the /demo bypass. */
export function demoEntryEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_DEMO === "1";
}

/** Puts the sample members in Discover, and lets them accept and reply. */
export function demoProfilesEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_DEMO_PROFILES === "1";
}
