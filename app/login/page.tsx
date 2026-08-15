"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import ConclaveLogo from "@/components/ConclaveLogo";
import DemoEnterButton from "@/components/DemoEnterButton";
import LinkedInButton from "@/components/LinkedInButton";
import { demoEntryEnabled } from "@/lib/demoFlag";
import { loadProfile } from "@/lib/store";

const ERRORS: Record<string, string> = {
  not_configured:
    "LinkedIn isn’t connected yet. Open .env.local, paste LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET from LinkedIn Developers → Auth, save, then restart npm run dev.",
  missing_code: "LinkedIn didn’t return a code. Please try again.",
  invalid_state: "This entry link expired. Please try again.",
  token_failed: "Couldn’t finish LinkedIn entry. Check your credentials and try again.",
  profile_failed: "Entered, but we couldn’t load your LinkedIn profile. Try again.",
  oauth_failed: "Something went wrong with LinkedIn. Please try again.",
  access_denied: "LinkedIn entry was cancelled.",
};

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const errorKey = params.get("error") || "";
  const error = ERRORS[errorKey] || (errorKey ? "Entry failed. Please try again." : "");

  // Returning members (esp. mobile) skip straight into The Room.
  useEffect(() => {
    const p = loadProfile();
    if (p?.verifications?.length && p.name) {
      router.replace("/discover");
    }
  }, [router]);

  return (
    <main className="relative grid min-h-dvh lg:grid-cols-2">
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
            &ldquo;If you have to ask what it is, it wasn&apos;t meant for you.&rdquo;
          </p>
        </div>
        <span className="absolute inset-5 border border-ivory/10" aria-hidden />
      </div>

      <div className="relative mx-auto flex w-full max-w-lg flex-col justify-center px-6 py-16 sm:px-10">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_70%)]"
          aria-hidden
        />

        <div className="relative">
          <div className="mp-reveal lg:hidden">
            <ConclaveLogo size={42} withWordmark />
          </div>
          <Link href="/" className="mp-reveal hidden lg:inline-flex">
            <ConclaveLogo size={42} withWordmark />
          </Link>

          <p className="mp-reveal mp-reveal-delay-1 mt-14 text-[10px] font-semibold uppercase tracking-[0.48em] text-accent">
            Members&apos; entrance
          </p>
          <h1 className="mp-reveal mp-reveal-delay-2 mt-4 font-display text-5xl font-semibold tracking-tight">
            Enter<span className="italic text-accent-2">.</span>
          </h1>
          <p className="mp-reveal mp-reveal-delay-3 mt-4 leading-[1.7] text-muted">
            Create your profile, then search The Room for people to meet — matched by ambition and
            settled over dinner.
          </p>

          {error && (
            <div className="mt-6 border border-accent/30 bg-accent/5 px-4 py-3 text-sm leading-relaxed text-accent-2">
              {error}
            </div>
          )}

          <div className="mp-reveal mp-reveal-delay-4 mt-10 space-y-5">
            <LinkedInButton label="Enter with LinkedIn" className="w-full sm:w-full" />

            <div className="lux-divider">
              <span className="text-[10px] font-semibold uppercase tracking-[0.36em] text-muted">
                or
              </span>
            </div>

            <Link
              href="/onboarding"
              className="mp-btn-lux inline-flex w-full items-center justify-center rounded-full bg-gradient-to-b from-accent-2 to-accent px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-ink shadow-[0_8px_24px_rgba(255,255,255,0.12)]"
            >
              Create profile & enter
            </Link>

            {demoEntryEnabled() && <DemoEnterButton />}
          </div>

          <p className="mt-12 text-xs leading-relaxed text-muted/65">
            We ask LinkedIn only for your name, photograph, and email — never your password.
          </p>
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
