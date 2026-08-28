"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AuthButtons from "@/components/AuthButtons";
import ProfileForm from "@/components/ProfileForm";
import Wordmark from "@/components/Wordmark";
import { loadProfile } from "@/lib/store";
import type { MyProfile } from "@/lib/types";

interface LinkedInUser {
  id: string;
  name: string;
  email?: string;
  picture?: string;
  provider: "linkedin";
}

function OnboardingContent() {
  const params = useSearchParams();
  const fromLinkedIn = params.get("linkedin") === "1";
  const [initial, setInitial] = useState<MyProfile | null>(null);
  const [linkedInUser, setLinkedInUser] = useState<LinkedInUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const existing = loadProfile();

    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data: { user: LinkedInUser | null }) => {
        const user = data.user;
        setLinkedInUser(user);

        if (user) {
          setInitial({
            name: existing?.name || user.name,
            jobTitle: existing?.jobTitle || "",
            bio: existing?.bio || "",
            photo: existing?.photo || user.picture || "",
            city: existing?.city || {
              name: "New York",
              country: "USA",
              lat: 40.7128,
              lng: -74.006,
            },
            travel: existing?.travel || "worldwide",
            meetPreference: existing?.meetPreference || "open",
            lookingFor: existing?.lookingFor || [],
            verifications: existing?.verifications || [],
            ideaTags: existing?.ideaTags || [],
            phone: existing?.phone,
            linkedInId: user.id,
          });
        } else {
          setInitial(existing);
        }
        setReady(true);
      })
      .catch(() => {
        setInitial(existing);
        setReady(true);
      });
  }, []);

  return (
    <main className="mp-stage relative min-h-dvh pb-24">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_70%)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-3xl px-6 pt-10 sm:pt-14">
        <Wordmark href="/" size="md" />

        <header className="mp-reveal mp-reveal-delay-1 mt-10 mb-12">
          <p className="mp-kicker">
            Membership petition
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Present yourself<span className="italic text-accent-2">.</span>
          </h1>
          <p className="mt-4 max-w-lg leading-relaxed text-muted">
            Present yourself, choose what you&apos;re looking for, then enter the room —
            introductions arranged with intent.
          </p>
        </header>

        {ready && (
          <>
            {!linkedInUser && (
              <div className="mp-reveal mp-reveal-delay-2 mb-12 space-y-5">
                <div className="mp-card-poster px-5 py-6">
                  <p className="font-display text-lg font-semibold text-ivory">Sign in first</p>
                  <p className="mt-0.5 text-sm text-muted">
                    Email, Google, Apple, or LinkedIn — so we can keep your seat.
                  </p>
                  <AuthButtons className="mt-4" />
                </div>

                <a
                  href="#profile-form"
                  className="inline-flex items-center justify-center text-[11px] font-semibold uppercase tracking-[0.22em] text-muted underline decoration-accent/30 underline-offset-6"
                >
                  Continue without an account
                </a>
              </div>
            )}

            {linkedInUser && (
              <div className="mp-reveal mp-reveal-delay-2 mb-12 flex items-center gap-3 border border-accent/30 bg-accent/5 px-4 py-3">
                {linkedInUser.picture && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={linkedInUser.picture}
                    alt=""
                    className="h-10 w-10 rounded-full border border-accent/40 object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-accent-2">
                    {fromLinkedIn ? "Signed in with LinkedIn" : "LinkedIn connected"}
                  </p>
                  <p className="truncate text-sm text-muted">
                    {linkedInUser.name}
                    {linkedInUser.email ? ` · ${linkedInUser.email}` : ""}
                  </p>
                </div>
              </div>
            )}

            <div id="profile-form" className="mp-reveal mp-reveal-delay-3">
              <ProfileForm initial={initial} />
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<main className="min-h-dvh" />}>
      <OnboardingContent />
    </Suspense>
  );
}
