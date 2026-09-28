"use client";

import { useRef, useState } from "react";
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
  PROFILE_LIMITS,
  emptyDraft,
  validateAll,
  type FieldErrors,
  type OnboardingDraft,
} from "@/lib/onboardingDraft";
import { writeOnboardingStep } from "@/lib/onboardingSession";
import type { MyProfile } from "@/lib/types";

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-white/10 pt-6">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">{title}</h2>
      <div className="mt-4 space-y-5">{children}</div>
    </section>
  );
}

/** Same fields as setup, on one page. */
export default function ProfileEditor({ initial }: { initial: MyProfile }) {
  const router = useRouter();
  const baseRef = useRef<MyProfile>(initial);
  const [draft, setDraft] = useState<OnboardingDraft>(() => emptyDraft(initial));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  function patch(partial: Partial<OnboardingDraft>) {
    setFormError("");
    setDraft((current) => ({ ...current, ...partial }));
    setErrors((current) => {
      const next = { ...current };
      for (const key of Object.keys(partial) as (keyof OnboardingDraft)[]) {
        delete next[key as keyof FieldErrors];
      }
      return next;
    });
  }

  async function save() {
    const found = validateAll(draft);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      setFormError("Fix the highlighted fields before saving.");
      return;
    }
    setSaving(true);
    setFormError("");
    const result = await persistDraft(draft, baseRef.current);
    setSaving(false);
    if (!result.ok) {
      setFormError(result.message || "Couldn’t save to your account. Check your connection and try again.");
      return;
    }
    baseRef.current = result.profile;
    writeOnboardingStep("done");
    showToast("Saved");
    router.refresh();
  }

  return (
    <form
      id="edit"
      className="scroll-mt-24 space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-ivory">Edit profile</h2>
        <p className="mt-1 text-sm text-muted">
          The same details from setup. Shared interests, what you’re looking for, and your industry
          change who you meet.
        </p>
      </div>

      <Block title="Basics">
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
          id="edit-name"
          label="Name"
          value={draft.name}
          max={PROFILE_LIMITS.name}
          error={errors.name}
          onChange={(name) => patch({ name })}
        />
        <TextField
          id="edit-headline"
          label="Headline"
          value={draft.jobTitle}
          max={PROFILE_LIMITS.headline}
          error={errors.jobTitle}
          onChange={(jobTitle) => patch({ jobTitle })}
        />
        <TextField
          id="edit-company"
          label="Company"
          value={draft.company}
          max={PROFILE_LIMITS.company}
          optional
          error={errors.company}
          onChange={(company) => patch({ company })}
        />
      </Block>

      <Block title="Work">
        <IndustryField
          value={draft.industry}
          error={errors.industry}
          onChange={(industry) => patch({ industry })}
        />
        <CityField city={draft.city} error={errors.city} onChange={(city) => patch({ city })} />
      </Block>

      <Block title="Goals">
        <LookingForField
          value={draft.lookingFor}
          error={errors.lookingFor}
          onChange={(lookingFor) => patch({ lookingFor })}
        />
      </Block>

      <Block title="Interests">
        <InterestPicker
          value={draft.ideaTags}
          error={errors.ideaTags}
          onChange={(ideaTags) => patch({ ideaTags })}
        />
      </Block>

      <Block title="Bio">
        <BioField value={draft.bio} error={errors.bio} onChange={(bio) => patch({ bio })} />
      </Block>

      {formError ? (
        <p className="text-[13px] text-accent-2" role="alert">
          {formError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        className="mp-btn-lux min-h-11 px-6 py-2.5 text-[13px] font-semibold disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
