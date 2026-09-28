const WALKTHROUGH_SESSION_FLAG = "conclave.demoOwner";

/**
 * Sample profiles and the walkthrough session are off unless the server
 * says ENABLE_DEMO_PROFILES is on. NEXT_PUBLIC_ flags and this saved flag
 * cannot turn them on.
 */
let serverAllowsDemo = false;
let serverGateKnown = false;

function readSavedFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(WALKTHROUGH_SESSION_FLAG) === "1";
  } catch {
    return false;
  }
}

/** True after refreshDemoGate has heard from the server. */
export function demoGateKnown(): boolean {
  return serverGateKnown;
}

/** True only after the server has allowed sample profiles for this page. */
export function demoEntryEnabled(): boolean {
  return serverGateKnown && serverAllowsDemo;
}

/** Puts sample members in Discover only when the server gate is on. */
export function demoProfilesEnabled(): boolean {
  return serverGateKnown && serverAllowsDemo;
}

export function applyServerDemoGate(enabled: boolean): void {
  serverGateKnown = true;
  serverAllowsDemo = enabled;
  if (!enabled) clearDemoOwnerSession();
}

/** Ask the server. A public env flag or a saved browser flag is ignored. */
export async function refreshDemoGate(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/demo", { credentials: "include" });
    applyServerDemoGate(res.ok);
    return res.ok;
  } catch {
    applyServerDemoGate(false);
    return false;
  }
}

/** Mark this browser only after the server has already allowed demo mode. */
export function markDemoOwnerSession(): void {
  if (typeof window === "undefined") return;
  if (!demoEntryEnabled()) return;
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

/** Saved walkthrough flag. It does not enable demo mode by itself. */
export function savedDemoFlagPresent(): boolean {
  return readSavedFlag();
}
