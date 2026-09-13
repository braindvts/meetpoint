"use client";

import { loginUrl } from "@/lib/appPath";
import { loadProfile, saveProfile } from "@/lib/store";
import type { MyProfile } from "@/lib/types";

function isUsableProfile(p: MyProfile | null | undefined): p is MyProfile {
  return !!p?.name?.trim() && !!p.jobTitle?.trim();
}

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

export type SessionGate =
  | { status: "member"; profile: MyProfile }
  | { status: "needs-onboarding" }
  | { status: "guest" };

/**
 * Distinguish a finished member from a signed-in stub vs a true guest.
 * Guests belong on /login — not dumped into Identity setup.
 */
export async function resolveSessionGate(): Promise<SessionGate> {
  const local = loadProfile();
  if (isUsableProfile(local)) return { status: "member", profile: local };

  try {
    const [meRes, authRes] = await Promise.all([
      fetch("/api/members/me", { credentials: "include" }),
      fetch("/api/auth/me", { credentials: "include" }),
    ]);
    const me = (await meRes.json()) as {
      ok?: boolean;
      profile?: MyProfile | null;
      memberId?: string | null;
    };
    const auth = (await authRes.json()) as { user?: unknown };
    if (me.ok && isUsableProfile(me.profile)) {
      saveProfile(me.profile);
      return { status: "member", profile: me.profile };
    }
    if (me.memberId || auth.user) return { status: "needs-onboarding" };
  } catch {
    /* offline */
  }

  if (local?.name) return { status: "needs-onboarding" };
  return { status: "guest" };
}

/** Where to send a non-member. `null` means they can stay. */
export function gateRedirect(gate: SessionGate, nextPath: string): string | null {
  if (gate.status === "member") return null;
  if (gate.status === "needs-onboarding") return "/onboarding";
  return loginUrl(nextPath);
}
