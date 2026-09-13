"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import AuthButtons from "@/components/AuthButtons";
import DemoEnterButton from "@/components/DemoEnterButton";
import EmailAuthForm from "@/components/EmailAuthForm";
import { demoEntryEnabled } from "@/lib/demoFlag";
import { loadProfile, saveProfile } from "@/lib/store";
import type { MyProfile } from "@/lib/types";

const ERRORS: Record<string, string> = {
  not_configured: "LinkedIn isn’t connected yet. Add LINKEDIN_CLIENT_ID and SECRET, then restart.",
  google_not_configured:
    "Google sign-in isn’t connected yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, then restart.",
  apple_not_configured:
    "Apple sign-in isn’t connected yet. Add APPLE_CLIENT_ID and APPLE_CLIENT_SECRET, then restart.",
  missing_code: "Sign-in didn’t return a code. Please try again.",
  invalid_state: "This entry link expired. Please try again.",
  token_failed: "Couldn’t finish sign-in. Check your credentials and try again.",
  token_invalid: "Sign-in token was rejected. Please try again.",
  profile_failed: "Signed in, but we couldn’t load your profile. Try again.",
  oauth_failed: "Something went wrong. Please try again.",
  access_denied: "Sign-in was cancelled.",
};

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const errorKey = params.get("error") || "";
  const error = ERRORS[errorKey] || (errorKey ? "Entry failed. Please try again." : "");

  useEffect(() => {
    const p = loadProfile();
    if (p?.verifications?.length && p.name) {
      router.replace("/discover");
      return;
    }
    void fetch("/api/members/me")
      .then((r) => r.json())
      .then((data: { ok?: boolean; profile?: MyProfile | null }) => {
        if (data.ok && data.profile?.name) {
          saveProfile(data.profile);
          if (data.profile.verifications?.length) router.replace("/discover");
        }
      })
      .catch(() => undefined);
  }, [router]);

  return (
    <main className="mp-app relative flex min-h-dvh flex-col items-center justify-center px-5 py-12">
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(196,180,150,0.05),transparent_50%)]" />
      </div>

      <div className="relative w-full max-w-[17.5rem] sm:max-w-[18.5rem]">
        <p className="text-center text-[0.7rem] font-semibold tracking-[0.28em] text-accent">
          INTERLINK
        </p>
        <h1 className="mt-5 text-center text-2xl font-semibold tracking-tight text-ivory">
          Sign in
        </h1>
        <p className="mt-1.5 text-center text-[13px] leading-snug text-muted">
          Pick a provider or use email.
        </p>

        {error && (
          <div className="mt-5 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2.5 text-[12px] leading-relaxed text-accent-2">
            {error}
          </div>
        )}

        <div className="mt-6 space-y-4">
          <AuthButtons />
          <div className="lux-divider">
            <span className="text-[9px] font-semibold uppercase tracking-[0.24em] text-muted">
              or email
            </span>
          </div>
          <EmailAuthForm />
          {demoEntryEnabled() && (
            <div className="pt-1 text-center">
              <DemoEnterButton />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-dvh bg-ink" />}>
      <LoginContent />
    </Suspense>
  );
}
