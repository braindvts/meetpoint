"use client";

import { useEffect, useState } from "react";
import { PREMIER_PLAN, formatPremierPrice } from "@/lib/plans";
import type { PremierInterval } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubscribe: (interval: PremierInterval) => void;
  peerName?: string;
  /** Pre-select monthly or yearly when opening. */
  initialInterval?: PremierInterval;
}

export default function PremierPlanSheet({
  open,
  onClose,
  onSubscribe,
  peerName,
  initialInterval = "year",
}: Props) {
  const [interval, setInterval] = useState<PremierInterval>(initialInterval);

  useEffect(() => {
    if (open) setInterval(initialInterval);
  }, [open, initialInterval]);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    const prevTouch = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.touchAction = prevTouch;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const yearly = interval === "year";

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Premier"
    >
      <button
        type="button"
        className="mp-backdrop-in absolute inset-0 bg-black/70 [-webkit-tap-highlight-color:transparent]"
        aria-label="Dismiss"
        onClick={onClose}
      />

      <div
        className="mp-modal-in relative z-10 w-full max-w-none sm:max-w-[400px] sm:px-4 sm:pb-4"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="mp-sheet">
          <div className="flex justify-center pt-2.5 sm:hidden" aria-hidden>
            <span className="h-px w-10 bg-white/35" />
          </div>

          <div className="px-6 pb-1 pt-5 text-left sm:pt-6">
            <p className="mp-kicker">Interlink</p>
            <h2 className="mt-2 font-display text-[1.65rem] font-semibold leading-tight tracking-tight text-ivory">
              {PREMIER_PLAN.name}
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-muted">
              {peerName
                ? `Unlock introductions to ${peerName.split(" ")[0]} and every higher standing.`
                : PREMIER_PLAN.tagline}
            </p>
          </div>

          <div className="mx-6 mt-4 flex border border-white/10 p-0.5">
            <button
              type="button"
              onClick={() => setInterval("month")}
              className={`flex-1 py-2.5 text-[12px] font-semibold uppercase tracking-[0.12em] transition duration-300 ${
                interval === "month" ? "bg-accent text-ink" : "text-muted hover:text-ivory"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setInterval("year")}
              className={`flex-1 py-2.5 text-[12px] font-semibold uppercase tracking-[0.12em] transition duration-300 ${
                yearly ? "bg-accent text-ink" : "text-muted hover:text-ivory"
              }`}
            >
              Yearly
            </button>
          </div>

          <div className="mx-6 mt-4 border-t border-white/10 pt-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-accent">
                {yearly ? "Yearly" : "Monthly"}
              </span>
              <span className="text-[1.35rem] font-semibold tracking-tight text-ivory">
                {formatPremierPrice(interval)}
              </span>
            </div>
            {yearly && (
              <p className="mt-2 text-[13px] leading-snug text-ivory/75">
                3-day free trial — then $100/year. Cancel before day 3 and you won’t be charged.
              </p>
            )}
            <ul className="mt-3 space-y-2 border-t border-white/10 pt-3">
              {PREMIER_PLAN.features.map((f) => (
                <li key={f} className="flex gap-3 text-[13px] leading-snug text-muted">
                  <span className="mt-2 h-px w-3 shrink-0 bg-accent/70" aria-hidden />
                  <span>{f}</span>
                </li>
              ))}
              {yearly && (
                <li className="flex gap-3 text-[13px] leading-snug text-muted">
                  <span className="mt-2 h-px w-3 shrink-0 bg-accent/70" aria-hidden />
                  <span>Save vs paying monthly ($240/yr)</span>
                </li>
              )}
            </ul>
          </div>

          <div className="flex flex-col gap-2 px-6 pb-6 pt-5">
            <button
              type="button"
              onClick={async () => {
                const { startPremierCheckout } = await import("@/lib/apiClient");
                const checkout = await startPremierCheckout(interval);
                if (checkout?.url) {
                  window.location.href = checkout.url;
                  return;
                }
                onSubscribe(interval);
              }}
              className="mp-btn-lux mp-spot min-h-[48px] w-full rounded-[2px] bg-gradient-to-b from-accent-2 to-accent py-3.5 text-[13px] font-semibold uppercase tracking-[0.16em] text-ink [-webkit-tap-highlight-color:transparent]"
            >
              {yearly ? "Start 3-day free trial" : "Subscribe · $20/mo"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] w-full py-3 text-[13px] font-medium text-muted transition duration-300 hover:text-ivory active:scale-[0.99] [-webkit-tap-highlight-color:transparent]"
            >
              Not now
            </button>
            <p className="text-center text-[11px] leading-relaxed text-white/35">
              {yearly
                ? "Trial is free for 3 days. After that, $100 yearly until you cancel in Membership."
                : "No card is charged until Stripe is connected. Cancel anytime in Membership."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
