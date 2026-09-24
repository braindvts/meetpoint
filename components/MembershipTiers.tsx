"use client";

import BlackBadge from "@/components/BlackBadge";
import TierBadge, { TIER_CARD } from "@/components/TierBadge";
import { TIER_DEFINITIONS, nextTierProgress, type TierInput } from "@/lib/tiers";

interface Props {
  input: TierInput;
  missing?: string[];
  missingHint?: string;
}

export default function MembershipTiers({ input, missing, missingHint }: Props) {
  const progress = nextTierProgress(input);

  return (
    <section className="mp-scroll-reveal mb-5 border border-line/50 bg-panel/40 p-3 sm:mb-10 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-accent sm:text-[11px] sm:tracking-[0.32em]">
            Standing
          </p>
          <p className="mt-1 max-w-sm text-[12px] text-muted">
            Who you are in the room — not a rank ladder.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TierBadge tier={progress.current} size="sm" />
          <p className="max-w-[16rem] text-[11px] text-muted sm:max-w-none">
            {progress.hint}
            {typeof input.profileStrength === "number"
              ? ` · Profile ${input.profileStrength}/100`
              : ""}
          </p>
        </div>
      </div>

      <div className="mp-scroll-stagger mt-4 grid gap-2.5 sm:grid-cols-3">
        {TIER_DEFINITIONS.map((t) => {
          const active = progress.current === t.tier;
          const black = t.tier === 3;
          return (
            <div
              key={t.tier}
              className={`mp-place flex min-h-[7.5rem] flex-col border px-3.5 py-3.5 ${TIER_CARD[t.tier].row} ${
                active ? "is-yours border-ivory/25" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                {black ? (
                  <span className="inline-flex items-center gap-2">
                    <BlackBadge size="sm" />
                    <span className="mp-level mp-level--black">BLACK</span>
                  </span>
                ) : (
                  <TierBadge tier={t.tier} size="sm" />
                )}
                {active ? (
                  <span className="text-[9px] font-medium uppercase tracking-[0.16em] text-muted">
                    Yours
                  </span>
                ) : null}
              </div>
              <p
                className={`mt-3 text-[14px] font-semibold tracking-tight ${
                  black ? "text-ivory" : TIER_CARD[t.tier].label
                }`}
              >
                {t.name}
              </p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted">{t.howToEarn}</p>
            </div>
          );
        })}
      </div>
      {missing && missing.length > 0 && progress.current < 3 && (
        <p className="mt-3 text-[11px] leading-relaxed text-muted">
          {missingHint ? `${missingHint}: ` : "Still open: "}
          {missing.slice(0, 4).join(" · ")}.
        </p>
      )}
    </section>
  );
}
