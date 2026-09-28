"use client";

import Link from "next/link";
import { matchingProgress } from "@/lib/onboardingDraft";
import type { MyProfile } from "@/lib/types";

/** Quiet prompt when fields that improve matching are still open. */
export default function ProfileProgressPrompt({
  profile,
}: {
  profile: Pick<
    MyProfile,
    "name" | "photo" | "jobTitle" | "industry" | "city" | "lookingFor" | "ideaTags" | "bio"
  > | null;
}) {
  if (!profile) return null;
  const progress = matchingProgress(profile);
  if (progress.doneCount >= progress.total) return null;
  const next = progress.items.find((item) => !item.done);
  const width = Math.round((progress.doneCount / progress.total) * 100);

  return (
    <Link
      href="/profile#edit"
      className="mb-4 block rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3 transition hover:border-accent/35"
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[13px] font-medium text-ivory">Complete your profile</p>
        <p className="tabular-nums text-[12px] text-muted">
          {progress.doneCount}/{progress.total}
        </p>
      </div>
      <div className="mt-2 h-0.5 bg-white/10" aria-hidden>
        <div className="h-full bg-accent" style={{ width: `${width}%` }} />
      </div>
      {next ? <p className="mt-2 text-[12px] text-muted">{next.hint}</p> : null}
    </Link>
  );
}
