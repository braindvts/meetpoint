"use client";

import TierBadge, { TIER_CARD } from "@/components/TierBadge";
import { TIER_DEFINITIONS, nextTierProgress, type TierInput } from "@/lib/tiers";

interface Props {
  input: TierInput;
  missing?: string[];
}

const ROW: Record<1 | 2 | 3 | 4, string> = {
  1: "border-[#9aa3ad]/20 bg-[#d7dde5]/[0.06]",
  2: "border-[#b9a99a]/20 bg-[#c9b8a8]/[0.08]",
  3: "border-[#6a6a6a]/35 bg-[#3a3a3a]/30",
  4: "border-white/15 bg-black relative overflow-hidden black-centurion",
};

export default function MembershipTiers({ input, missing }: Props) {
  const progress = nextTierProgress(input);

  return (
    <section className="mb-5 border border-line/50 bg-panel/40 p-3 sm:mb-10 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-accent sm:text-[11px] sm:tracking-[0.32em]">
          Tiers
        </p>
        <div className="flex items-center gap-2">
          <TierBadge tier={progress.current} size="sm" />
          <p className="max-w-[16rem] text-[10px] text-muted sm:max-w-none sm:text-xs">
            {progress.hint}
            {typeof input.profileStrength === "number"
              ? ` · Profile ${input.profileStrength}/100`
              : ""}
          </p>
        </div>
      </div>

      <div className="mt-2.5 space-y-1.5 sm:mt-4 sm:space-y-2">
        {TIER_DEFINITIONS.map((t) => {
          const active = progress.current === t.tier;
          const black = t.tier === 4;
          return (
            <div
              key={t.tier}
              className={`border px-2.5 py-2 sm:px-3.5 sm:py-3 ${ROW[t.tier]} ${
                active && !black ? "ring-1 ring-ivory/20" : ""
              }`}
            >
              {black && (
                <span
                  className="pointer-events-none absolute inset-0 bg-[linear-gradient(118deg,rgba(255,255,255,0.1)_0%,transparent_40%)]"
                  aria-hidden
                />
              )}
              <div className="relative z-[1] flex items-center gap-2.5">
                <TierBadge tier={t.tier} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p
                      className={`truncate font-display text-[13px] font-semibold sm:text-base ${
                        black ? "text-[#f5f5f5]" : TIER_CARD[t.tier].label
                      }`}
                    >
                      {t.tier}. {t.name}
                    </p>
                    {active && (
                      <span
                        className={`shrink-0 text-[8px] font-semibold uppercase tracking-[0.14em] ${
                          black ? "text-[#f5f5f5]" : "text-accent-2"
                        }`}
                      >
                        You
                      </span>
                    )}
                  </div>
                  <p
                    className={`truncate text-[10px] sm:text-[11px] ${
                      black ? "text-[#a8a8a8]" : "text-muted"
                    }`}
                  >
                    {t.howToEarn}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {missing && missing.length > 0 && (
        <p className="mt-3 text-[11px] leading-relaxed text-muted">
          Add to raise your tier: {missing.slice(0, 4).join(" · ")}.
        </p>
      )}
    </section>
  );
}
