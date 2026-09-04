"use client";

import {
  PREMIER_PLAN,
  formatPremierPrice,
  hasActivePremier,
  isPremierOnTrial,
  premierStatusLabel,
} from "@/lib/plans";
import type { MyProfile, PremierInterval } from "@/lib/types";

interface Props {
  profile: MyProfile;
  onBuy: (prefer?: PremierInterval) => void;
  onCancel?: () => void;
  onSwitchInterval?: (interval: PremierInterval) => void;
}

export default function MembershipPlans({
  profile,
  onBuy,
  onCancel,
  onSwitchInterval,
}: Props) {
  const premier = hasActivePremier(profile);
  const onTrial = isPremierOnTrial(profile);
  const current: PremierInterval = profile.premierPlan?.interval || "month";

  return (
    <section className="mb-5 sm:mb-10">
      <div className="mb-2.5 flex items-baseline justify-between gap-2">
        <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-accent sm:text-[11px] sm:tracking-[0.32em]">
          Plans
        </p>
        <p className="text-[10px] text-muted sm:text-xs">
          {premier ? premierStatusLabel(profile) : "Free Member"}
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
        {/* Free */}
        <div className="flex items-center justify-between gap-3 border border-accent/25 bg-panel/50 px-3 py-2.5 sm:block sm:p-5">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-muted">Included</p>
            <p className="mt-0.5 font-display text-base font-semibold text-ivory sm:text-xl">
              Member <span className="text-muted">· $0</span>
            </p>
          </div>
          <ul className="hidden space-y-1.5 text-xs text-ivory/70 sm:mt-3 sm:block sm:text-sm">
            <li>The Room · your verified tier</li>
            <li>Tier 1 ↔ Tier 1 introductions</li>
            <li>Private chats & bookings</li>
          </ul>
          <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-accent-2 sm:mt-4">
            {premier ? "Base" : "Current"}
          </p>
        </div>

        {/* Premier */}
        <div
          className={`border px-3 py-2.5 sm:p-5 ${
            premier
              ? "border-white/25 bg-black black-centurion"
              : "border-accent/30 bg-panel/70"
          }`}
        >
          <div className="relative z-[1]">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-accent-2">
                  Recommended
                </p>
                <p className="mt-0.5 font-display text-base font-semibold text-ivory sm:text-xl">
                  {PREMIER_PLAN.name}
                </p>
              </div>
              {premier && (
                <span className="shrink-0 border border-white/20 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-ivory">
                  {onTrial ? "Trial" : "Active"}
                </span>
              )}
            </div>

            <div className="mt-2 flex rounded-md border border-white/12 bg-white/[0.03] p-0.5">
              <button
                type="button"
                onClick={() => {
                  if (premier) onSwitchInterval?.("month");
                  else onBuy("month");
                }}
                className={`flex-1 rounded px-1 py-1.5 text-center transition ${
                  premier && current === "month"
                    ? "bg-white text-black"
                    : "text-ivory/75 hover:bg-white/[0.05]"
                }`}
              >
                <span className="block text-[10px] font-semibold sm:text-[11px]">Monthly</span>
                <span className="block text-[9px] opacity-70">{formatPremierPrice("month")}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (premier) onSwitchInterval?.("year");
                  else onBuy("year");
                }}
                className={`flex-1 rounded px-1 py-1.5 text-center transition ${
                  premier && current === "year"
                    ? "bg-white text-black"
                    : "text-ivory/75 hover:bg-white/[0.05]"
                }`}
              >
                <span className="block text-[10px] font-semibold sm:text-[11px]">Yearly</span>
                <span className="block text-[9px] opacity-70">
                  {formatPremierPrice("year")} · trial
                </span>
              </button>
            </div>

            <ul className="mt-2 hidden space-y-1 text-xs text-ivory/70 sm:block sm:text-sm">
              {PREMIER_PLAN.features.slice(0, 3).map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <p className="mt-1.5 text-[10px] leading-snug text-muted sm:hidden">
              Meet Trusted, Connector & Elite · cancel anytime
            </p>

            {premier ? (
              onCancel ? (
                <button
                  type="button"
                  onClick={onCancel}
                  className="mt-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted transition hover:text-ivory"
                >
                  Cancel Premier
                </button>
              ) : null
            ) : (
              <button
                type="button"
                onClick={() => onBuy("year")}
                className="mp-btn-lux mt-2 w-full rounded-full bg-gradient-to-b from-accent-2 to-accent py-2 text-[12px] font-semibold text-ink sm:mt-3 sm:py-2.5 sm:text-[13px]"
              >
                Choose Premier
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
