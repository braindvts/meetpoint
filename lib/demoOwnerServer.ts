import "server-only";

import { DEMO_OWNER_EMAIL, isDemoOwnerEmail } from "./demoOwner";

/**
 * Demo owner password — server-only. Override with DEMO_OWNER_PASSWORD env.
 * Never import this from client components.
 */
export function demoOwnerPassword(): string {
  return process.env.DEMO_OWNER_PASSWORD?.trim() || "Brian812";
}

export function matchesDemoOwner(email: string, password: string): boolean {
  return isDemoOwnerEmail(email) && password === demoOwnerPassword();
}

export { DEMO_OWNER_EMAIL };
