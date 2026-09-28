"use client";

import { draftToProfile, profileSaveError, type OnboardingDraft } from "@/lib/onboardingDraft";
import { syncProfileToServer } from "@/lib/apiClient";
import { saveProfile } from "@/lib/store";
import type { MyProfile } from "@/lib/types";

export async function persistDraft(
  draft: OnboardingDraft,
  base: MyProfile | null
): Promise<{ ok: boolean; profile: MyProfile; message?: string; code?: string }> {
  const next = draftToProfile(draft, base);
  saveProfile(next);
  const remote = await syncProfileToServer(next);
  if (remote?.ok && remote.profile) {
    const merged: MyProfile = {
      ...next,
      ...remote.profile,
      premierPlan: remote.profile.premierPlan ?? next.premierPlan,
      black: remote.profile.black ?? next.black,
      blackSince: remote.profile.blackSince ?? next.blackSince,
      blackSource: remote.profile.blackSource ?? next.blackSource,
      meetingsAttended: remote.profile.meetingsAttended ?? next.meetingsAttended,
    };
    saveProfile(merged);
    return { ok: true, profile: merged };
  }
  return {
    ok: false,
    profile: next,
    code: remote?.error,
    message: profileSaveError(remote?.error),
  };
}
