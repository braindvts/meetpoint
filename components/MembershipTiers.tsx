"use client";

import TierBadge from "@/components/TierBadge";
import { TIER_DEFINITIONS, nextTierProgress, type TierInput } from "@/lib/tiers";

interface Props {
  input: TierInput;
  missing?: string[];
}

/**
 * Standing as a connected signal path — not a stacked membership board,
 * not numbered 01/02, not metal rows.
 */
export default function MembershipTiers({ input, missing }: Props) {
  const progress = nextTierProgress(input);

  return (
    <section className="il-panel mb-5 p-4 sm:mb-10 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="il-kicker">Standing</p>
          <p className="mt-1.5 font-display text-xl font-semibold tracking-tight text-ivory">
            You are {TIER_DEFINITIONS.find((t) => t.tier === progress.current)?.name}
          </p>
        </div>
        <p className="max-w-sm text-[12px] leading-relaxed text-muted">{progress.hint}</p>
      </div>

      <div className="stand-path mt-6">
        {TIER_DEFINITIONS.map((t, i) => {
          const active = progress.current === t.tier;
          return (
            <div key={t.tier} className="stand-path-item">
              {i > 0 ? <span className="stand-path-link" aria-hidden /> : null}
              <div className={`stand-path-card ${active ? "is-you" : ""}`}>
                <div className="flex items-center gap-2">
                  <TierBadge tier={t.tier} size="sm" />
                  {active ? <span className="stand-you">You</span> : null}
                </div>
                <p className="mt-2 text-[12px] leading-snug text-muted">{t.howToEarn}</p>
              </div>
            </div>
          );
        })}
      </div>

      {missing && missing.length > 0 && progress.current < 3 && (
        <p className="mt-4 text-[12px] leading-relaxed text-muted">
          Still open: {missing.slice(0, 4).join(" · ")}.
        </p>
      )}
    </section>
  );
}
