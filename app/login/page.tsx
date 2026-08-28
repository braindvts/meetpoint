"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import AuthButtons from "@/components/AuthButtons";
import DemoEnterButton from "@/components/DemoEnterButton";
import EmailAuthForm from "@/components/EmailAuthForm";
import Wordmark from "@/components/Wordmark";
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
    <main className="mp-stage relative grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <div
          className="absolute inset-0 bg-cover bg-center animate-[kenburns_22s_ease-out_both]"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=2000&q=90)",
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(6,5,9,0.4), rgba(6,5,9,0.94)), linear-gradient(to top, rgba(6,5,9,0.88), transparent 55%)",
          }}
          aria-hidden
        />
        <div className="absolute bottom-0 left-0 p-14">
          <p className="font-display max-w-sm text-3xl italic leading-[1.35] text-ivory/95">
            Private introductions. Settled over dinner.
          </p>
          <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.32em] text-muted">
            Powered by Montevere Co.
          </p>
        </div>
      </div>

      <div className="relative mx-auto flex w-full max-w-lg flex-col justify-center px-6 py-16 sm:px-10">
        <div className="relative">
          <Wordmark href="/" size="md" />

          <p className="mt-12 mp-kicker">
            Members&apos; entrance
          </p>
          <h1 className="mt-5 font-display text-5xl font-semibold tracking-tight sm:text-6xl">
            Enter<span className="italic text-accent">.</span>
          </h1>
          <p className="mt-4 leading-[1.7] text-muted">
            Sign in to keep your seat. Email, Google, Apple, or LinkedIn — your session stays on
            this device.
          </p>

          {error && (
            <div className="mt-6 border border-accent/30 bg-accent/5 px-4 py-3 text-sm leading-relaxed text-accent-2">
              {error}
            </div>
          )}

          <div className="mt-10 space-y-6">
            <AuthButtons />

            <div className="lux-divider">
              <span className="text-[10px] font-semibold uppercase tracking-[0.36em] text-muted">
                or email
              </span>
            </div>

            <EmailAuthForm />

            <Link
              href="/onboarding"
              className="inline-flex w-full items-center justify-center border border-accent/30 py-3.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted transition hover:border-accent/60 hover:text-ivory"
            >
              Continue to profile
            </Link>

            {demoEntryEnabled() && <DemoEnterButton />}
          </div>
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
