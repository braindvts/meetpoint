const WALKTHROUGH_SESSION_FLAG = "conclave.demoOwner";

/**
 * Demo mode is for looking at the app locally. Public env flags default to
 * off. A walkthrough owner session is marked only after the server says so
 * (`demoOwner: true`), which requires ENABLE_WALKTHROUGH_OWNER on the server.
 */

function walkthroughSessionActive(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(WALKTHROUGH_SESSION_FLAG) === "1";
  } catch {
    return false;
  }
}

/** Shows "Enter demo" and enables the /demo bypass. */
export function demoEntryEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_DEMO === "1" || walkthroughSessionActive();
}

/** Puts the sample members in Discover, and lets them accept and reply. */
export function demoProfilesEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_DEMO_PROFILES === "1" || walkthroughSessionActive();
}

/** Mark this browser as a local walkthrough after the server confirms it. */
export function markDemoOwnerSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WALKTHROUGH_SESSION_FLAG, "1");
  } catch {
    /* ignore */
  }
}

export function clearDemoOwnerSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(WALKTHROUGH_SESSION_FLAG);
  } catch {
    /* ignore */
  }
}
