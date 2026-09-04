"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MembershipPlans from "@/components/MembershipPlans";
import MembershipTiers from "@/components/MembershipTiers";
import Avatar from "@/components/Avatar";
import EditProfilePopup from "@/components/EditProfilePopup";
import BlackMembershipCard from "@/components/BlackMembershipCard";
import Nav from "@/components/Nav";
import PageHeader from "@/components/PageHeader";
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
    black: profile.black === true,
  };

  return (
    <>
      <Nav />
      <main className="mp-app pb-24">
        <PageHeader title="Profile" />
        <div className="px-4 pb-6 pt-2">
        {needsVerify && (
          <div className="mb-4 rounded-xl border border-accent/30 bg-accent/5 px-3 py-2 text-[12px] leading-snug text-accent-2">
            Verification required. Add a company email, LinkedIn, website, registration, or
            portfolio below.
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

        <MembershipPlans
          profile={profile}
          onBuy={(prefer) => {
            setSheetInterval(prefer || "year");
            setPremierOpen(true);
          }}
          onCancel={cancel}
          onSwitchInterval={switchInterval}
        />

        <BlackMembershipCard
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

        <MembershipTiers input={tierInput} missing={strength.missing} />

        <p className="mb-2.5 mt-6 scroll-mt-20 text-[12px] font-medium text-accent" id="edit-details">
          Edit details
        </p>
        <ProfileForm initial={profile} />
        </div>
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
