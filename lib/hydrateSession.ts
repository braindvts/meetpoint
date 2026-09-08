"use client";

import { loadProfile, saveProfile } from "@/lib/store";
import type { MyProfile } from "@/lib/types";

/**
 * Prefer the local profile when one exists.
 * Never overwrite local verifications with a stale server copy — that was
 * re-Verifying people after they cleared email / LinkedIn and saved.
 */
export async function hydrateLocalProfile(): Promise<MyProfile | null> {
  const local = loadProfile();
  if (local?.name && local.jobTitle) return local;

  try {
    const res = await fetch("/api/members/me", { credentials: "include" });
    const data = (await res.json()) as {
      ok?: boolean;
      profile?: MyProfile | null;
    };
    if (data.ok && data.profile?.name) {
      saveProfile(data.profile);
      return data.profile;
    }
  } catch {
    /* offline / not signed in */
  }
  return loadProfile();
}
