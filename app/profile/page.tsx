"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MemberStatusStrip from "@/components/MemberStatusStrip";
import PlansSection from "@/components/PlansSection";
import Avatar from "@/components/Avatar";
import EditProfilePopup from "@/components/EditProfilePopup";
import Nav from "@/components/Nav";
import PageHeader from "@/components/PageHeader";
import ProfileForm from "@/components/ProfileForm";
import MembershipTiers from "@/components/MembershipTiers";
import { ensureNotifyPermission } from "@/lib/notify";
import { clearProfile, getMeetingsAttended, loadProfile } from "@/lib/store";
import { readClientProfile } from "@/lib/clientProfile";
import { hydrateLocalProfile } from "@/lib/hydrateSession";
import {
  computeMemberTier,
  hasRequiredVerifications,
  isProfileComplete,
  missingRequiredVerifications,
  reputationScoreForMeetings,
  scoreProfileStrength,
} from "@/lib/tiers";
import type { MyProfile } from "@/lib/types";

function ProfileContent() {
  const router = useRouter();
  const params = useSearchParams();
  const needsVerify = params.get("verify") === "1";
  const [profile, setProfile] = useState<MyProfile | null>(() => readClientProfile());
  const [meetings, setMeetings] = useState(() => {
    const p = readClientProfile();
    return p ? getMeetingsAttended(p) : 0;
  });
  const [editPopupOpen, setEditPopupOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const p = await hydrateLocalProfile();
      if (cancelled) return;
      if (!p) {
        router.replace("/onboarding");
        return;
      }
      setProfile(p);
      setMeetings(getMeetingsAttended(p));
    })();

    const onProfile = () => {
      const next = loadProfile();
      setProfile(next);
      if (next) setMeetings(getMeetingsAttended(next));
    };
    window.addEventListener("meetpoint:profile-changed", onProfile);
    return () => {
      cancelled = true;
      window.removeEventListener("meetpoint:profile-changed", onProfile);
    };
  }, [router]);

  useEffect(() => {
    if (!needsVerify) return;
    const timer = window.setTimeout(() => {
      document.getElementById("section-verification")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 200);
    return () => window.clearTimeout(timer);
  }, [needsVerify]);

  function reset() {
    if (confirm("Delete your profile and all connections?")) {
      clearProfile();
      router.push("/");
    }
  }

  if (!profile) return null;

  const strength = scoreProfileStrength(profile);
  const missingVerify = missingRequiredVerifications(profile.verifications);
  const tierInput = {
    verified: hasRequiredVerifications(profile.verifications),
    profileComplete: isProfileComplete(profile),
    meetingsAttended: meetings,
    reputationScore: reputationScoreForMeetings(meetings),
    profileStrength: strength.score,
    black: profile.black === true,
  };

  return (
    <>
      <Nav />
      <main className="mp-app px-0 pb-10 md:px-6">
        <PageHeader title="Profile" />
        <div className="px-4 pb-6 pt-2">
        {needsVerify && (
          <div className="mb-4 rounded-xl border border-accent/45 bg-accent/[0.08] px-3.5 py-3 text-[13px] leading-snug text-accent-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
              Verification required
            </p>
            <p className="mt-1.5">
              To connect beyond Members, become{" "}
              <span className="font-semibold text-ivory">Verified</span> with only{" "}
              <span className="font-semibold text-ivory">
                business email · LinkedIn
              </span>
              . Resume and website are optional.
              {missingVerify.length > 0 ? (
                <>
                  {" "}
                  Still needed:{" "}
                  <span className="font-semibold text-ivory">{missingVerify.join(" · ")}</span>.
                </>
              ) : null}
            </p>
          </div>
        )}

        <section className="mp-person-card mb-5 flex items-center justify-between gap-3 p-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setEditPopupOpen(true)}
              className="shrink-0"
              aria-label="Edit profile"
            >
              <Avatar
                src={profile.photo}
                name={profile.name}
                sizeCls="h-14 w-14"
                rounded="rounded-[12px]"
              />
            </button>
            <div>
              <h2 className="font-display text-xl font-semibold text-ivory">{profile.name}</h2>
              <p className="text-[12px] text-accent">{profile.jobTitle || "Member"}</p>
            </div>
          </div>
          <button type="button" onClick={reset} className="text-[12px] text-red-400">
            Reset
          </button>
        </section>

        <MemberStatusStrip profile={profile} tier={computeMemberTier(tierInput)} />

        <PlansSection
          profile={profile}
          meetings={meetings}
          reputationScore={reputationScoreForMeetings(meetings)}
          profileStrength={strength.score}
        />

        <section className="mp-person-card mb-5 p-4">
          <p className="text-[12px] font-medium text-accent">Alerts</p>
          <p className="mt-1 text-sm text-muted">
            Browser notifications for intros and table confirmations.
          </p>
          <button
            type="button"
            onClick={() => void ensureNotifyPermission()}
            className="mt-3 rounded-md border border-accent/40 px-4 py-2 text-[12px] text-accent"
          >
            Enable alerts
          </button>
        </section>

        <MembershipTiers
          input={tierInput}
          missing={
            tierInput.verified
              ? strength.missing.filter(
                  (m) => !["Business email", "LinkedIn"].includes(m)
                )
              : missingVerify
          }
          missingHint={
            tierInput.verified
              ? "Optional extras for a stronger profile"
              : "Only these two for Verified"
          }
        />

        <p className="mb-2.5 mt-6 scroll-mt-20 text-[12px] font-medium text-accent" id="edit-details">
          Edit details
        </p>
        <ProfileForm initial={profile} focusVerification={needsVerify} />
        </div>
      </main>

      <EditProfilePopup
        open={editPopupOpen}
        profile={profile}
        onClose={() => setEditPopupOpen(false)}
        editHref="/profile#edit-details"
      />
    </>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfileContent />
    </Suspense>
  );
}
