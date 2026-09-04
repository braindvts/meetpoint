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
import type { MyProfile } from "@/lib/types";

interface Props {
  profile: MyProfile;
  meetings: number;
  reputationScore: number;
  profileStrength: number;
}

/**
 * BLACK on the member's own profile: buy it, claim it once earned, and see the
 * BLACK CONNECTION credential — which is counted, never purchased.
 */
export default function BlackMembershipCard({
  profile,
  meetings,
  reputationScore,
  profileStrength,
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

  const verified = (profile.verifications?.length ?? 0) > 0;
  const isBlack = profile.black === true;
  const req = BLACK_EARNED_REQUIREMENTS;
  const earnedReady =
    verified &&
    meetings >= req.meetings &&
    reputationScore >= req.reputationScore &&
    profileStrength >= req.profileStrength;
  const level = blackConnectionLevel(connections);

  async function buy(interval: "month" | "year") {
    setBusy(interval);
    setError("");
    const checkout = await startBlackCheckout(interval);
    if (checkout?.url) {
      window.location.href = checkout.url;
      return;
    }
    // No Stripe key configured — activate locally, still gated on verification.
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
    <section
      className={`mb-5 rounded-2xl p-4 sm:p-5 ${
        isBlack ? "black-centurion border border-white/20" : "border border-line/70 bg-panel/60"
      }`}
    >
      {isBlack && <span className="black-sheen" aria-hidden />}

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <BlackBadge size="md" />
            {isBlack && level.count > 0 ? (
              <BlackConnectionBadge count={level.count} variant="compact" showCount />
            ) : null}
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-ivory/75">
            {isBlack
              ? "Your BLACK membership is active. You can extend a BLACK connection from any private conversation."
              : "The top of the room: verified, premium, serious. Reach any tier without Premier, and extend BLACK connections privately."}
          </p>
        </div>
      </div>

      {isBlack ? (
        <p className="relative mt-3 text-[11px] uppercase tracking-[0.18em] text-white/45">
          {profile.blackSource === "earned"
            ? "Earned"
            : profile.blackSource === "granted"
              ? "Granted"
              : "Member"}
          {profile.blackSince
            ? ` · since ${new Date(profile.blackSince).toLocaleDateString(undefined, {
                month: "short",
                year: "numeric",
              })}`
            : ""}
        </p>
      ) : (
        <>
          {!verified && (
            <p className="mt-3 rounded-xl border border-accent/30 bg-accent/5 px-3 py-2 text-[12px] leading-snug text-accent-2">
              Verify your profile first. Paying doesn&apos;t skip verification.
            </p>
          )}

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              disabled={!verified || busy !== null}
              onClick={() => buy("year")}
              className="rounded-xl bg-gradient-to-b from-accent-2 to-accent px-4 py-3 text-[12px] font-semibold text-ink disabled:opacity-40"
            >
              {busy === "year" ? "Opening…" : `Buy BLACK · ${formatBlackPrice("year")}`}
            </button>
            <button
              type="button"
              disabled={!verified || busy !== null}
              onClick={() => buy("month")}
              className="rounded-xl border border-accent/40 px-4 py-3 text-[12px] font-medium text-accent disabled:opacity-40"
            >
              {busy === "month" ? "Opening…" : `Monthly · ${formatBlackPrice("month")}`}
            </button>
          </div>

          <div className="mt-4 border-t border-white/[0.07] pt-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent/70">
              Or earn it
            </p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
              {req.meetings} dinners attended · standing of {req.reputationScore}+ · profile
              strength {req.profileStrength}+
            </p>
            <p className="mt-1 text-[12px] text-ivory/60">
              You&apos;re at {meetings} dinners, standing {reputationScore}, strength{" "}
              {profileStrength}.
            </p>
            <button
              type="button"
              disabled={!earnedReady || busy !== null}
              onClick={claimEarned}
              className="mt-3 rounded-xl border border-accent/40 px-4 py-2.5 text-[12px] font-medium text-accent disabled:opacity-40"
            >
              {busy === "earned" ? "Checking…" : earnedReady ? "Claim earned BLACK" : "Not yet eligible"}
            </button>
          </div>
        </>
      )}

      {level.count > 0 && (
        <div className="relative mt-4 border-t border-white/[0.07] pt-3">
          <div className="flex items-center justify-between gap-2">
            <BlackConnectionBadge count={level.count} showCount />
            <span className={`text-[11px] ${isBlack ? "text-white/50" : "text-muted"}`}>
              {level.name}
            </span>
          </div>
          {level.next && (
            <p className={`mt-2 text-[12px] ${isBlack ? "text-white/55" : "text-muted"}`}>
              {level.next.atLeast - level.count} more to {level.next.name} — {level.next.benefit}
            </p>
          )}
        </div>
      )}

      {error && <p className="relative mt-3 text-[12px] text-red-400">{error}</p>}
    </section>
  );
}
