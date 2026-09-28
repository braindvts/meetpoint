"use client";

import { SITE_ORIGIN } from "@/lib/site";
import { showToast } from "@/lib/notify";

export async function copyInviteLink(): Promise<void> {
  try {
    await navigator.clipboard.writeText(SITE_ORIGIN);
    showToast("Invite link copied");
  } catch {
    showToast(SITE_ORIGIN);
  }
}
