"use client";

import { useEffect, useState } from "react";
import BlackBadge from "@/components/BlackBadge";
import BlackConnectionBadge from "@/components/BlackConnectionBadge";
import ReauthDialog from "@/components/ReauthDialog";
import {
  BLACK_EARNED_REQUIREMENTS,
  blackConnectionLevel,
  formatBlackPrice,
} from "@/lib/black";
import { claimBlack, myBlackConnectionCount } from "@/lib/blackStore";
import { startBlackCheckout } from "@/lib/apiClient";
import { track } from "@/lib/analytics";
import { hasRequiredVerifications } from "@/lib/tiers";
import type { MyProfile } from "@/lib/types";

interface Props {
  profile: MyProfile;
  meetings: number;
  reputationScore: number;
  profileStrength: number;
}

/**
 * Plans: BLACK first, then Free. No Premier — Verified unlocks higher intros.
 */
export default function PlansSection({
  profile,
  meetings,
  reputationScore,
  profileStrength,
}: Props) {
  const [busy, setBusy] = useState<"month" | "year" | "earned" | null>(null);
  const [error, setError] = useState("");
  const [connections, setConnections] = useState(0);
  const [reauthOpen, setReauthOpen] = useState(false);
  const [pendingBuy, setPendingBuy] = useState<"month" | "year" | null>(null);

  useEffect(() => {
    const sync = () => setConnections(myBlackConnectionCount());
    sync();
    window.addEventListener("meetpoint:black-changed", sync);
    return () => window.removeEventListener("meetpoint:black-changed", sync);
  }, []);

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
    if (checkout?.needsReauth) {
      setPendingBuy(interval);
      setReauthOpen(true);
      setBusy(null);
      return;
    }
    if (checkout?.url) {
      window.location.href = checkout.url;
      return;
    }
    const result = await claimBlack("paid");
    if (!result.ok) {
      if (result.needsReauth) {
        setPendingBuy(interval);
        setReauthOpen(true);
      } else {
        setError(result.error || "Could not activate BLACK.");
      }
    } else track("black_activated_paid");
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
          {isBlack ? "BLACK active" : verified ? "Verified · Free" : "Free Member"}
        </p>
      </div>

      <div className="space-y-2.5">
        <div className="black-centurion px-3.5 py-4 sm:px-4 sm:py-4">
          <div className="relative z-[1]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <BlackBadge size="sm" />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent/80">
                      Top of the room
                    </p>
                    <p className="text-[17px] font-semibold tracking-tight text-ivory">BLACK</p>
                  </div>
                </div>
                <p className="mt-2 text-[12px] leading-snug text-muted">
                  Meet anyone · {formatBlackPrice("month")} or {formatBlackPrice("year")}
                </p>
              </div>
              {isBlack ? (
                <span className="shrink-0 border border-accent/30 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-ivory">
                  Active
                </span>
              ) : null}
            </div>

            {isBlack ? (
              <div className="mt-3 space-y-2">
                <p className="text-[12px] text-accent/80">
                  You’re BLACK
                  {profile.blackSource ? ` · ${profile.blackSource}` : ""}.
                </p>
                {connections > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <BlackConnectionBadge count={connections} showCount />
                    {level.name ? (
                      <span className="text-[11px] text-muted">{level.name}</span>
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
                    Get Verified first (email + LinkedIn), then unlock BLACK.
                  </p>
                ) : null}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={!verified || busy !== null}
                    onClick={() => void buyBlack("month")}
                    className="rounded-lg border border-white/20 py-2.5 text-[12px] font-semibold text-ivory disabled:opacity-40"
                  >
                    {busy === "month" ? "…" : formatBlackPrice("month")}
                  </button>
                  <button
                    type="button"
                    disabled={!verified || busy !== null}
                    onClick={() => void buyBlack("year")}
                    className="rounded-lg border border-accent/50 bg-accent/15 py-2.5 text-[12px] font-semibold text-accent disabled:opacity-40"
                  >
                    {busy === "year" ? "…" : formatBlackPrice("year")}
                  </button>
                </div>
                {earnedReady ? (
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => void claimEarned()}
                    className="w-full text-[11px] font-semibold uppercase tracking-[0.14em] text-ivory underline-offset-2 hover:underline"
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

        <div className="border border-line/60 bg-ink/40 px-3.5 py-3 sm:px-4 sm:py-3.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[15px] font-semibold text-ivory">Free</p>
              <p className="mt-0.5 text-[12px] leading-snug text-muted">
                $0 · Member ↔ Member intros. Get Verified to meet anyone.
              </p>
            </div>
            {!isBlack ? (
              <span className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.14em] text-accent-2">
                {verified ? "Verified" : "Current"}
              </span>
            ) : (
              <span className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">
                Base
              </span>
            )}
          </div>
        </div>
      </div>

      <ReauthDialog
        open={reauthOpen}
        onClose={() => {
          setReauthOpen(false);
          setPendingBuy(null);
        }}
        onSuccess={() => {
          if (pendingBuy) void buyBlack(pendingBuy);
        }}
        title="Confirm to buy BLACK"
      />
    </section>
  );
}
