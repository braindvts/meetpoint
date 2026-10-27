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
 * Plans: BLACK first, then Free. No Premier. Verified is what lets you meet further.
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
    <section className="mb-8">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3">
        <p className="font-display text-2xl text-ivory">Plans</p>
        <p className="text-[12px] text-muted">
          {isBlack ? "BLACK active" : verified ? "Verified, free" : "Free Member"}
        </p>
      </div>

      <div>
        <div className="border-b border-line py-4">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <BlackBadge size="sm" />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                      Membership
                    </p>
                    <p className="font-display text-[1.7rem] text-ivory">BLACK</p>
                  </div>
                </div>
                <p className="mt-2 text-[13px] leading-snug text-muted">
                  Meet anyone. {formatBlackPrice("month")} or {formatBlackPrice("year")}.
                </p>
              </div>
              {isBlack ? (
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">
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
                  <p className="text-[11px] text-muted">
                    Invite peers from a private chat to award BLACK CONNECTION. That is not BLACK.
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {!verified ? (
                  <p className="text-[11px] text-accent">
                    Get Verified first. Add a business email and LinkedIn. Then you can buy BLACK.
                  </p>
                ) : null}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={!verified || busy !== null}
                    onClick={() => void buyBlack("month")}
                    className="mp-press rounded-lg border border-white/20 py-2.5 text-[12px] font-semibold text-ivory disabled:opacity-40"
                  >
                    {busy === "month" ? "…" : formatBlackPrice("month")}
                  </button>
                  <button
                    type="button"
                    disabled={!verified || busy !== null}
                    onClick={() => void buyBlack("year")}
                    className="mp-press rounded-lg border border-accent/50 bg-accent/15 py-2.5 text-[12px] font-semibold text-accent disabled:opacity-40"
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
                  <p className="text-[10px] text-muted">
                    Or earn it: {req.meetings}+ dinners · strong profile · top ratings
                  </p>
                )}
                {error ? <p className="text-[11px] text-accent">{error}</p> : null}
              </div>
            )}
          </div>
        </div>

        <div className="py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-[1.7rem] text-ivory">Free</p>
              <p className="mt-1 text-[13px] leading-snug text-muted">
                $0. Introductions between Members. Get Verified to meet anyone.
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
