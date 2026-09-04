import { DEMO_OWNER_FLAG_KEY } from "./demoOwner";

/**
 * Demo mode is for looking at the app locally. Env flags default to off, so a
 * deployed Conclave only ever shows real members — unless someone signs in with
 * the fixed Brian demo account, which turns sample people on for that browser.
 */

function demoOwnerSessionActive(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(DEMO_OWNER_FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

/** Shows "Enter demo" and enables the /demo bypass. */
export function demoEntryEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_DEMO === "1" || demoOwnerSessionActive();
}

/** Puts the sample members in Discover, and lets them accept and reply. */
export function demoProfilesEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_DEMO_PROFILES === "1" || demoOwnerSessionActive();
}

/** Mark this browser as the Brian demo walkthrough after a successful login. */
export function markDemoOwnerSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DEMO_OWNER_FLAG_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function clearDemoOwnerSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(DEMO_OWNER_FLAG_KEY);
  } catch {
    /* ignore */
  }
}
