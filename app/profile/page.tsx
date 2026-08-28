"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MembershipPlans from "@/components/MembershipPlans";
import MembershipTiers from "@/components/MembershipTiers";
import Avatar from "@/components/Avatar";
import EditProfilePopup from "@/components/EditProfilePopup";
import EliteInviteCard from "@/components/EliteInviteCard";
import Nav from "@/components/Nav";
import PremierPlanSheet from "@/components/PremierPlanSheet";
import ProfileForm from "@/components/ProfileForm";
import { ensureNotifyPermission } from "@/lib/notify";
import {
  activatePremierPlan,
  cancelPremierPlan,
  clearProfile,
  getMeetingsAttended,
  loadProfile,
  switchPremierInterval,
} from "@/lib/store";
import { readClientProfile } from "@/lib/clientProfile";
import { isProfileComplete, reputationScoreForMeetings, scoreProfileStrength } from "@/lib/tiers";
import type { MyProfile, PremierInterval } from "@/lib/types";

function ProfileContent() {
  const router = useRouter();
  const params = useSearchParams();
  const needsVerify = params.get("verify") === "1";
  const buyPremier = params.get("plan") === "premier" || params.get("plan") === "pro";
  const [profile, setProfile] = useState<MyProfile | null>(() => readClientProfile());
  const [meetings, setMeetings] = useState(() => {
    const p = readClientProfile();
    return p ? getMeetingsAttended(p) : 0;
  });
  const [premierOpen, setPremierOpen] = useState(false);
  const [sheetInterval, setSheetInterval] = useState<PremierInterval>("year");
  const [editPopupOpen, setEditPopupOpen] = useState(false);

  useEffect(() => {
    const p = loadProfile();
    if (!p) {
      router.replace("/onboarding");
      return;
    }
    setProfile(p);
    setMeetings(getMeetingsAttended(p));
    if (buyPremier && !p.premierPlan?.active) setPremierOpen(true);

    const onProfile = () => {
      const next = loadProfile();
      setProfile(next);
      if (next) setMeetings(getMeetingsAttended(next));
    };
    window.addEventListener("meetpoint:profile-changed", onProfile);
    return () => window.removeEventListener("meetpoint:profile-changed", onProfile);
  }, [router, buyPremier]);

  function reset() {
    if (confirm("Delete your profile and all connections?")) {
      clearProfile();
      router.push("/");
    }
  }

  function subscribe(interval: "month" | "year") {
    const next = activatePremierPlan(interval);
    if (next) setProfile(next);
    setPremierOpen(false);
  }

  function switchInterval(interval: PremierInterval) {
    const next = switchPremierInterval(interval);
    if (next) setProfile(next);
  }

  function cancel() {
    if (
      !confirm(
        "Cancel Conclave Premier? Tier 1 will only introduce to other Tier 1 members."
      )
    ) {
      return;
    }
    const next = cancelPremierPlan();
    if (next) setProfile(next);
  }

  if (!profile) return null;

  const strength = scoreProfileStrength(profile);
  const tierInput = {
    verified: (profile.verifications?.length ?? 0) > 0,
    profileComplete: isProfileComplete(profile),
    meetingsAttended: meetings,
    reputationScore: reputationScoreForMeetings(meetings),
    profileStrength: strength.score,
    elite: profile.elite === true,
  };

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-3 py-4 pb-24 sm:px-6 sm:py-10">
        {needsVerify && (
          <div className="mb-3 border border-accent/30 bg-accent/5 px-3 py-2 text-[11px] leading-snug text-accent-2 sm:mb-6 sm:px-4 sm:py-3 sm:text-sm">
            Verification required. Add a company email, LinkedIn, website, registration, or
            portfolio below.
          </div>
        )}

        <section className="mp-reveal mp-room-banner mb-5 p-4 sm:mb-8 sm:p-7">
          <div className="relative z-[1] flex items-end justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => setEditPopupOpen(true)}
                className="group relative shrink-0 transition duration-300 hover:scale-[1.03] [-webkit-tap-highlight-color:transparent]"
                aria-label="Edit profile"
              >
                <span className="absolute -inset-1 border border-accent/25" />
                <Avatar
                  src={profile.photo}
                  name={profile.name}
                  sizeCls="h-14 w-14 sm:h-16 sm:w-16"
                  rounded="rounded-none"
                />
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 border border-accent/40 bg-ink px-2 py-px text-[8px] font-semibold uppercase tracking-[0.14em] text-accent">
                  Edit
                </span>
              </button>
              <div>
                <p className="mp-kicker">
                  Membership
                </p>
                <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-4xl">
                  Your seat<span className="italic text-accent">.</span>
                </h1>
              </div>
            </div>
            <button
              onClick={reset}
              className="border border-red-500/50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-red-400 transition hover:border-red-400 hover:bg-red-500/10 sm:px-4 sm:py-1.5"
            >
              Reset
            </button>
          </div>
        </section>

        <MembershipPlans
          profile={profile}
          onBuy={(prefer) => {
            setSheetInterval(prefer || "year");
            setPremierOpen(true);
          }}
          onCancel={cancel}
          onSwitchInterval={switchInterval}
        />

        <EliteInviteCard elite={profile.elite === true} />

        <section className="mb-5 mp-card-poster p-4 sm:mb-8 sm:p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">
            Alerts
          </p>
          <p className="mt-1 text-sm text-muted">
            Browser notifications for intros and table confirmations. Native iOS/Android push
            needs a separate FCM/APNs setup later.
          </p>
          <button
            type="button"
            onClick={() => void ensureNotifyPermission()}
            className="mt-3 border border-accent/40 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-2"
          >
            Enable alerts
          </button>
        </section>

        <MembershipTiers input={tierInput} missing={strength.missing} />

        <p className="mp-kicker mb-2.5 scroll-mt-20 sm:mb-5" id="edit-details">
          Edit details
        </p>
        <ProfileForm initial={profile} />
      </main>

      <PremierPlanSheet
        open={premierOpen}
        initialInterval={sheetInterval}
        onClose={() => setPremierOpen(false)}
        onSubscribe={subscribe}
      />

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
    <Suspense fallback={<main className="min-h-dvh" />}>
      <ProfileContent />
    </Suspense>
  );
}
