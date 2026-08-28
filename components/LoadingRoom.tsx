"use client";

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
        <p className="font-display text-4xl font-semibold text-ivory">
          Con<span className="text-accent">clave</span>
        </p>
        <p className="mt-5 max-w-xs font-display text-lg italic text-ivory/75">
          {label}
          <span className="mp-loading-dots" aria-hidden>
            …
          </span>
        </p>
        <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.32em] text-muted/70">
          Powered by Montevere Co.
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
