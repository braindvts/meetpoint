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
    <section className="mb-8">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-3">
        <div>
          <p className="font-display text-2xl text-ivory">Standing</p>
          <p className="mt-1 max-w-sm text-[13px] text-muted">Member, Verified, or BLACK.</p>
        </div>
        <div className="flex items-center gap-2">
          <TierBadge tier={progress.current} size="sm" />
          <p className="max-w-[16rem] text-[12px] text-muted sm:max-w-none">
            {progress.hint}
            {typeof input.profileStrength === "number"
              ? ` · Profile ${input.profileStrength}/100`
              : ""}
          </p>
        </div>
      </div>

      <div className="mp-standing">
        {TIER_DEFINITIONS.map((t) => {
          const active = progress.current === t.tier;
          const black = t.tier === 3;
          return (
            <article key={t.tier} className={active ? "bg-panel/60" : ""}>
              <div>
                {black ? (
                  <span className="inline-flex items-center gap-2">
                    <BlackBadge size="sm" />
                    <span className="mp-level mp-level--black">BLACK</span>
                  </span>
                ) : (
                  <TierBadge tier={t.tier} size="sm" />
                )}
                {active ? (
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
                    Yours
                  </p>
                ) : null}
              </div>
              <div>
                <h3 className={black ? "text-ivory" : TIER_CARD[t.tier].label}>{t.name}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">{t.howToEarn}</p>
              </div>
            </article>
          );
        })}
      </div>
      {missing && missing.length > 0 && progress.current < 3 && (
        <p className="mt-3 text-[12px] leading-relaxed text-muted">
          {missingHint ? `${missingHint}: ` : "Still open: "}
          {missing.slice(0, 4).join(" · ")}.
        </p>
      )}
    </section>
  );
}
