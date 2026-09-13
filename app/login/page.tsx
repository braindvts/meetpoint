"use client";

import Link from "next/link";
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
    <main className="mp-app flex min-h-dvh flex-col px-6 pb-10 pt-16 md:max-w-lg md:pt-20">
      <p className="mp-reveal text-[11px] font-semibold uppercase tracking-[0.3em] text-accent">
        Interlink
      </p>
      <span className="mp-reveal mp-reveal-delay-1 mp-line mt-5 block h-px w-14 bg-accent" aria-hidden />
      <h1 className="mp-reveal mp-reveal-delay-2 mt-8 text-3xl font-semibold tracking-tight text-ivory">
        Sign in
      </h1>
      <p className="mp-reveal mp-reveal-delay-3 mt-2 text-sm leading-relaxed text-muted">
        Email, Google, Apple, or LinkedIn — your session stays on this device.
      </p>

      {error && (
        <div className="mt-6 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm leading-relaxed text-accent-2">
          {error}
        </div>
      )}

      <div className="mt-8 space-y-5">
        <AuthButtons />
        <div className="lux-divider">
          <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted">
            or email
          </span>
        </div>
        <EmailAuthForm />
        <Link
          href="/onboarding"
          className="inline-flex w-full items-center justify-center rounded-xl border border-accent/25 py-3.5 text-[12px] font-medium text-muted"
        >
          Continue to profile
        </Link>
        {demoEntryEnabled() && <DemoEnterButton />}
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
