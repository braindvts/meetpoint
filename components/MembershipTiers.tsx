"use client";

import TierBadge, { TIER_CARD } from "@/components/TierBadge";
import { TIER_DEFINITIONS, nextTierProgress, type TierInput } from "@/lib/tiers";

interface Props {
  input: TierInput;
  missing?: string[];
}

export default function MembershipTiers({ input, missing }: Props) {
  const progress = nextTierProgress(input);

  return (
    <section className="mp-board-section mb-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mp-kicker">Standing</p>
          <p className="mt-2 text-[15px] font-semibold tracking-tight text-ivory">Three levels</p>
        </div>
        <div className="flex items-center gap-2">
          <TierBadge tier={progress.current} size="sm" />
        </div>
      </div>
      <p className="mt-2 max-w-lg text-[12px] leading-relaxed text-muted">
        {progress.hint}
        {typeof input.profileStrength === "number" ? ` · Profile ${input.profileStrength}/100` : ""}
      </p>

      <div className="mp-board mt-5">
        {TIER_DEFINITIONS.map((t) => {
          const active = progress.current === t.tier;
          return (
            <div
              key={t.tier}
              className={`mp-board-row ${TIER_CARD[t.tier].row} ${active ? "is-you" : ""}`}
            >
              <TierBadge tier={t.tier} size="sm" />
              <div className="min-w-0">
                {active ? (
                  <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-accent">
                    You
                  </p>
                ) : null}
                <p className="text-[13px] leading-relaxed text-muted">{t.howToEarn}</p>
              </div>
            </div>
          );
        })}
      </div>
      {missing && missing.length > 0 && progress.current < 3 && (
        <p className="mt-3 text-[11px] leading-relaxed text-muted">
          Still open: {missing.slice(0, 4).join(" · ")}.
        </p>
      )}
    </section>
  );
}
