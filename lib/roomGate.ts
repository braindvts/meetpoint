import type { MyProfile } from "./types";

/**
 * Identity is enough to enter the room. Verification is optional —
 * a Member with a name and role is not stuck on the sign-in screen.
 */
export function isUsableProfile(p: MyProfile | null | undefined): p is MyProfile {
  return !!p?.name?.trim() && !!p.jobTitle?.trim();
}
