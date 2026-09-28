"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AuthButtons from "@/components/AuthButtons";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import { emptyDraft, stepIdToIndex } from "@/lib/onboardingDraft";
import { loadProfile } from "@/lib/store";
import type { MyProfile } from "@/lib/types";

function OnboardingContent() {
  const params = useSearchParams();
  const startStep = stepIdToIndex(params.get("step"));
  const [initial, setInitial] = useState<MyProfile | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const local = loadProfile();
    Promise.all([
      fetch("/api/members/me", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/auth/me", { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([me, auth]: [{ profile?: MyProfile | null; memberId?: string | null; ok?: boolean }, { user?: { name?: string } | null }]) => {
        const server = me?.profile && me.profile.name ? me.profile : null;
        setSignedIn(!!(me?.memberId || auth?.user));
        setInitial(server || local);
        setReady(true);
      })
      .catch(() => {
        setInitial(local);
        setReady(true);
      });
  }, []);

  return (
    <main className="mp-app relative min-h-dvh px-4 pb-16 pt-10 md:px-6">
      {ready ? (
        <>
          {!signedIn ? (
            <div className="mx-auto mb-10 w-full max-w-xl border border-white/10 bg-[#0a0a0a] px-5 py-5">
              <p className="font-medium text-ivory">Sign in to keep this profile</p>
              <p className="mt-1 text-sm text-muted">
                Email, Google, Apple, or LinkedIn. You can still fill this in on this device.
              </p>
              <AuthButtons className="mt-4" />
            </div>
          ) : null}
          <OnboardingWizard
            key={initial ? emptyDraft(initial).name : "new"}
            initial={initial}
            signedIn={signedIn}
            startStep={startStep}
          />
        </>
      ) : (
        <p className="mx-auto mt-16 max-w-xl text-sm text-muted">Loading your profile…</p>
      )}
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<main className="min-h-dvh bg-ink" />}>
      <OnboardingContent />
    </Suspense>
  );
}
