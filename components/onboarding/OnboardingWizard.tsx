"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import InterestPicker from "@/components/onboarding/InterestPicker";
import {
  BioField,
  CityField,
  IndustryField,
  LookingForField,
  PhotoField,
  TextField,
} from "@/components/onboarding/ProfileFields";
import { persistDraft } from "@/components/onboarding/persistDraft";
import { showToast } from "@/lib/notify";
import {
  ONBOARDING_STEPS,
  PROFILE_LIMITS,
  emptyDraft,
  resumeStep,
  validateStep,
  type FieldErrors,
  type OnboardingDraft,
} from "@/lib/onboardingDraft";
import { readOnboardingStep, writeOnboardingStep } from "@/lib/onboardingSession";
import type { MyProfile } from "@/lib/types";

const COPY: Record<(typeof ONBOARDING_STEPS)[number]["id"], { title: string; body: string }> = {
  basics: {
    title: "The basics",
    body: "Your name, photo, and what you do. This is what people see first.",
  },
  work: {
    title: "Where you work",
    body: "Industry and city help Interlink find people close to your world.",
  },
  goals: {
    title: "What you’re looking for",
    body: "Introductions are built around this. Pick every one that fits.",
  },
  interests: {
    title: "Your interests",
    body: "Shared interests are the strongest match. Choose up to 24, including your own.",
  },
  bio: {
    title: "A short bio",
    body: "Optional. A few sentences on what you’re building make a better introduction.",
  },
};

export default function OnboardingWizard({
  initial,
  signedIn,
  startStep,
}: {
  initial: MyProfile | null;
  signedIn: boolean;
  /** Deep link, such as /onboarding?step=interests */
  startStep?: number | null;
}) {
  const router = useRouter();
  const baseRef = useRef<MyProfile | null>(initial);
  const [draft, setDraft] = useState<OnboardingDraft>(() => emptyDraft(initial));
  const [step, setStep] = useState(() => {
    if (startStep != null) return startStep;
    return resumeStep(emptyDraft(initial), readOnboardingStep());
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const dirty = useRef(false);
  const stepIndex = step === "done" ? ONBOARDING_STEPS.length - 1 : step;
  const meta = ONBOARDING_STEPS[stepIndex];
  const copy = COPY[meta.id];

  useEffect(() => {
    if (step === "done" && startStep == null) {
      router.replace("/discover");
      return;
    }
    writeOnboardingStep(stepIndex);
  }, [router, startStep, step, stepIndex]);

  useEffect(() => {
    if (!dirty.current) return;
    if (!draft.name.trim()) return;
    const timer = window.setTimeout(() => {
      void persistDraft(draft, baseRef.current).then((result) => {
        if (result.ok) baseRef.current = result.profile;
      });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [draft]);

  function patch(partial: Partial<OnboardingDraft>) {
    dirty.current = true;
    setSaveError("");
    setDraft((current) => ({ ...current, ...partial }));
    setErrors((current) => {
      const next = { ...current };
      for (const key of Object.keys(partial) as (keyof OnboardingDraft)[]) {
        delete next[key as keyof FieldErrors];
      }
      return next;
    });
  }

  async function go(nextStep: number | "done") {
    const found = validateStep(stepIndex, draft);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    setSaving(true);
    setSaveError("");
    const result = await persistDraft(draft, baseRef.current);
    setSaving(false);
    if (signedIn && !result.ok) {
      setSaveError("Couldn’t save to your account. Check your connection and try again.");
      return;
    }
    if (result.ok) baseRef.current = result.profile;
    if (!signedIn) showToast("Saved on this device");
    if (nextStep === "done") {
      writeOnboardingStep("done");
      router.replace("/discover");
      return;
    }
    writeOnboardingStep(nextStep);
    setStep(nextStep);
    setErrors({});
  }

  const last = stepIndex === ONBOARDING_STEPS.length - 1;

  if (step === "done") {
    return <p className="text-sm text-muted">Taking you into the room…</p>;
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <p className="text-[0.75rem] font-medium tracking-[0.14em] text-accent">INTERLINK</p>
      <div className="mt-8" aria-label="Setup progress">
        <div className="flex items-center justify-between gap-3 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
          <span>
            {stepIndex + 1} of {ONBOARDING_STEPS.length}
            <span className="ml-2 text-ivory">{meta.label}</span>
          </span>
        </div>
        <div
          className="mt-3 flex gap-1.5"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={ONBOARDING_STEPS.length}
          aria-valuenow={stepIndex + 1}
          aria-valuetext={`${meta.label}, step ${stepIndex + 1} of ${ONBOARDING_STEPS.length}`}
        >
          {ONBOARDING_STEPS.map((item, index) => (
            <span
              key={item.id}
              className={`h-0.5 flex-1 ${index <= stepIndex ? "bg-accent" : "bg-white/12"}`}
            />
          ))}
        </div>
      </div>

      <div key={meta.id} className="mp-step-in mt-8">
        <h1 className="text-3xl font-semibold tracking-tight text-ivory">{copy.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">{copy.body}</p>

        <div className="mt-8 space-y-6">
          {meta.id === "basics" ? (
            <>
              <PhotoField
                photo={draft.photo}
                name={draft.name}
                error={errors.photo}
                onChange={(photo, photoError) => {
                  patch({ photo });
                  if (photoError) setErrors((current) => ({ ...current, photo: photoError }));
                }}
              />
              <TextField
                id="onboard-name"
                label="Name"
                value={draft.name}
                max={PROFILE_LIMITS.name}
                error={errors.name}
                placeholder="Your name"
                onChange={(name) => patch({ name })}
              />
              <TextField
                id="onboard-headline"
                label="Headline"
                value={draft.jobTitle}
                max={PROFILE_LIMITS.headline}
                error={errors.jobTitle}
                placeholder="Founder, investor, operator…"
                onChange={(jobTitle) => patch({ jobTitle })}
              />
              <TextField
                id="onboard-company"
                label="Company"
                value={draft.company}
                max={PROFILE_LIMITS.company}
                optional
                error={errors.company}
                placeholder="Company or venture"
                onChange={(company) => patch({ company })}
              />
            </>
          ) : null}

          {meta.id === "work" ? (
            <>
              <IndustryField
                value={draft.industry}
                error={errors.industry}
                onChange={(industry) => patch({ industry })}
              />
              <CityField city={draft.city} error={errors.city} onChange={(city) => patch({ city })} />
            </>
          ) : null}

          {meta.id === "goals" ? (
            <LookingForField
              value={draft.lookingFor}
              error={errors.lookingFor}
              onChange={(lookingFor) => patch({ lookingFor })}
            />
          ) : null}

          {meta.id === "interests" ? (
            <InterestPicker
              value={draft.ideaTags}
              error={errors.ideaTags}
              onChange={(ideaTags) => patch({ ideaTags })}
            />
          ) : null}

          {meta.id === "bio" ? (
            <BioField value={draft.bio} error={errors.bio} onChange={(bio) => patch({ bio })} />
          ) : null}
        </div>
      </div>

      {saveError ? (
        <p className="mt-6 text-[13px] text-accent-2" role="alert">
          {saveError}
        </p>
      ) : null}

      <div className="mt-10 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            if (stepIndex === 0) return;
            setErrors({});
            setStep(stepIndex - 1);
          }}
          disabled={stepIndex === 0 || saving}
          className="min-h-11 px-2 text-[13px] font-medium text-muted disabled:opacity-30"
        >
          Back
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => void go(last ? "done" : stepIndex + 1)}
          className="mp-btn-lux min-h-11 px-6 py-2.5 text-[13px] font-semibold disabled:opacity-50"
        >
          {saving ? "Saving…" : last ? "Finish" : "Next"}
        </button>
      </div>
    </div>
  );
}
