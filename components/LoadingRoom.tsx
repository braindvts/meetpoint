"use client";

import ConclaveLogo from "@/components/ConclaveLogo";
import SkeletonCard from "@/components/SkeletonCard";

interface Props {
  /** Show match-card skeletons under the seal. */
  withCards?: boolean;
  label?: string;
}

/** In-app loading — quieter than the session splash, same world. */
export default function LoadingRoom({
  withCards = false,
  label = "Preparing the room",
}: Props) {
  return (
    <div className="mx-auto max-w-5xl px-3 py-16 sm:px-6 sm:py-24">
      <div className="flex flex-col items-center text-center">
        <div className="mp-ambient relative">
          <ConclaveLogo size={48} />
        </div>
        <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.42em] text-muted">
          {label}
          <span className="mp-loading-dots" aria-hidden>
            …
          </span>
        </p>
      </div>
      {withCards && (
        <div className="mt-12 grid gap-2.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}
    </div>
  );
}
