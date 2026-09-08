"use client";

import { useEffect, useState } from "react";
import BlackBadge from "@/components/BlackBadge";
import BlackConnectionBadge from "@/components/BlackConnectionBadge";
import {
  BLACK_EARNED_REQUIREMENTS,
  blackConnectionLevel,
  formatBlackPrice,
} from "@/lib/black";
import { claimBlack, myBlackConnectionCount } from "@/lib/blackStore";
import { startBlackCheckout } from "@/lib/apiClient";
import { track } from "@/lib/analytics";
import {
  PREMIER_PLAN,
  formatPremierPrice,
  hasActivePremier,
  isPremierOnTrial,
  premierStatusLabel,
} from "@/lib/plans";
import { hasRequiredVerifications } from "@/lib/tiers";
import type { MyProfile, PremierInterval } from "@/lib/types";

interface Props {
  profile: MyProfile;
  meetings: number;
  reputationScore: number;
  profileStrength: number;
  onBuyPremier: (prefer?: PremierInterval) => void;
  onCancelPremier?: () => void;
  onSwitchPremier?: (interval: PremierInterval) => void;
}

/**
 * One Plans block: Free · Premier · BLACK — short copy, grouped together.
 */
export default function PlansSection({
  profile,
  meetings,
  reputationScore,
  profileStrength,
  onBuyPremier,
  onCancelPremier,
  onSwitchPremier,
}: Props) {
  const [busy, setBusy] = useState<"month" | "year" | "earned" | null>(null);
  const [error, setError] = useState("");
  const [connections, setConnections] = useState(0);

  useEffect(() => {
    const sync = () => setConnections(myBlackConnectionCount());
    sync();
    window.addEventListener("meetpoint:black-changed", sync);
    return () => window.removeEventListener("meetpoint:black-changed", sync);
  }, []);

  const premier = hasActivePremier(profile);
  const onTrial = isPremierOnTrial(profile);
  const current: PremierInterval = profile.premierPlan?.interval || "month";
  const verified = hasRequiredVerifications(profile.verifications);
  const isBlack = profile.black === true;
  const req = BLACK_EARNED_REQUIREMENTS;
  const earnedReady =
    verified &&
    meetings >= req.meetings &&
    reputationScore >= req.reputationScore &&
    profileStrength >= req.profileStrength;
  const level = blackConnectionLevel(connections);

  async function buyBlack(interval: "month" | "year") {
    setBusy(interval);
    setError("");
    const checkout = await startBlackCheckout(interval);
    if (checkout?.url) {
      window.location.href = checkout.url;
      return;
    }
    const result = await claimBlack("paid");
    if (!result.ok) setError(result.error || "Could not activate BLACK.");
    else track("black_activated_paid");
    setBusy(null);
  }

  async function claimEarned() {
    setBusy("earned");
    setError("");
    const result = await claimBlack("earned");
    if (!result.ok) setError(result.error || "Not eligible yet.");
    else track("black_activated_earned");
    setBusy(null);
  }

  return (
    <section className="mb-6 border border-line/50 bg-panel/40 p-3 sm:mb-10 sm:p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-accent sm:text-[11px]">
          Plans
        </p>
        <p className="text-[10px] text-muted sm:text-xs">
          {isBlack
            ? "BLACK active"
            : premier
              ? premierStatusLabel(profile)
              : "Free Member"}
        </p>
      </div>

      <div className="space-y-2.5">
        {/* Free */}
        <div className="border border-line/60 bg-ink/40 px-3.5 py-3 sm:px-4 sm:py-3.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[15px] font-semibold text-ivory">Free</p>
              <p className="mt-0.5 text-[12px] text-muted">$0 · Member ↔ Member intros</p>
            </div>
            {!premier && !isBlack ? (
              <span className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.14em] text-accent-2">
                Current
              </span>
            ) : (
              <span className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">
                Base
              </span>
            )}
          </div>
        </div>

        {/* Premier */}
        <div className="border border-accent/30 bg-ink/50 px-3.5 py-3 sm:px-4 sm:py-3.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[15px] font-semibold text-ivory">Premier</p>
              <p className="mt-0.5 text-[12px] leading-snug text-muted">
                Meet Verified & BLACK · {formatPremierPrice("month")} or{" "}
                {formatPremierPrice("year")}
              </p>
            </div>
            {premier ? (
              <span className="shrink-0 border border-accent/35 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-accent">
                {onTrial ? "Trial" : "Active"}
              </span>
            ) : null}
          </div>

          <div className="mt-2.5 flex rounded-md border border-white/10 bg-white/[0.03] p-0.5">
            <button
              type="button"
              onClick={() => {
                if (premier) onSwitchPremier?.("month");
                else onBuyPremier("month");
              }}
              className={`flex-1 rounded px-2 py-1.5 text-center text-[11px] font-medium transition ${
                premier && current === "month"
                  ? "bg-accent text-ink"
                  : "text-ivory/75 hover:bg-white/[0.05]"
              }`}
            >
              Monthly · {formatPremierPrice("month")}
            </button>
            <button
              type="button"
              onClick={() => {
                if (premier) onSwitchPremier?.("year");
                else onBuyPremier("year");
              }}
              className={`flex-1 rounded px-2 py-1.5 text-center text-[11px] font-medium transition ${
                premier && current === "year"
                  ? "bg-accent text-ink"
                  : "text-ivory/75 hover:bg-white/[0.05]"
              }`}
            >
              Yearly · {formatPremierPrice("year")}
            </button>
          </div>

          {premier ? (
            onCancelPremier ? (
              <button
                type="button"
                onClick={onCancelPremier}
                className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted hover:text-ivory"
              >
                Cancel Premier
              </button>
            ) : null
          ) : (
            <button
              type="button"
              onClick={() => onBuyPremier("year")}
              className="mp-btn-lux mt-2.5 w-full rounded-xl bg-gradient-to-b from-accent-2 to-accent py-2.5 text-[12px] font-semibold text-ink"
            >
              Get Premier
            </button>
          )}
          <p className="mt-1.5 text-[10px] text-muted/80">
            {PREMIER_PLAN.yearly.trialNote} · cancel anytime
          </p>
        </div>

        {/* BLACK */}
        <div className="border border-white/15 bg-black px-3.5 py-3 black-centurion sm:px-4 sm:py-3.5">
          <div className="relative z-[1]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <BlackBadge size="xs" />
                  <p className="text-[15px] font-semibold text-[#f5f5f5]">BLACK</p>
                </div>
                <p className="mt-1 text-[12px] leading-snug text-[#a8a8a8]">
                  Top of the room · meet anyone · {formatBlackPrice("month")} or{" "}
                  {formatBlackPrice("year")}
                </p>
              </div>
              {isBlack ? (
                <span className="shrink-0 border border-white/25 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-[#f5f5f5]">
                  Active
                </span>
              ) : null}
            </div>

            {isBlack ? (
              <div className="mt-3 space-y-2">
                <p className="text-[12px] text-[#cfcfcf]">
                  You’re BLACK
                  {profile.blackSource ? ` · ${profile.blackSource}` : ""}.
                </p>
                {connections > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <BlackConnectionBadge count={connections} showCount />
                    {level.name ? (
                      <span className="text-[11px] text-[#a8a8a8]">{level.name}</span>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-[11px] text-[#8a8a8a]">
                    Invite peers from a private chat to award BLACK CONNECTION — never BLACK.
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {!verified ? (
                  <p className="text-[11px] text-[#c4b59a]">
                    Get Verified first (email + LinkedIn + resume), then unlock BLACK.
                  </p>
                ) : null}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={!verified || busy !== null}
                    onClick={() => void buyBlack("month")}
                    className="rounded-xl border border-white/20 py-2 text-[11px] font-semibold text-[#f5f5f5] disabled:opacity-40"
                  >
                    {busy === "month" ? "…" : formatBlackPrice("month")}
                  </button>
                  <button
                    type="button"
                    disabled={!verified || busy !== null}
                    onClick={() => void buyBlack("year")}
                    className="rounded-xl bg-[#f5f5f5] py-2 text-[11px] font-semibold text-black disabled:opacity-40"
                  >
                    {busy === "year" ? "…" : formatBlackPrice("year")}
                  </button>
                </div>
                {earnedReady ? (
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => void claimEarned()}
                    className="w-full text-[11px] font-semibold uppercase tracking-[0.14em] text-[#f5f5f5] underline-offset-2 hover:underline"
                  >
                    {busy === "earned" ? "Claiming…" : "Claim earned BLACK"}
                  </button>
                ) : (
                  <p className="text-[10px] text-[#7a7a7a]">
                    Or earn it: {req.meetings}+ dinners · strong profile · top ratings
                  </p>
                )}
                {error ? <p className="text-[11px] text-red-300/90">{error}</p> : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
