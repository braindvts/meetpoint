import { enterAsDemo } from "./store";

/**
 * Install the local Mohammed profile only after the server allows it.
 * ENABLE_DEMO_PROFILES must be set. A public NEXT_PUBLIC_ flag is not enough.
 */
export async function requestDemoEntry(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/demo", {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return false;
    enterAsDemo();
    return true;
  } catch {
    return false;
  }
}
