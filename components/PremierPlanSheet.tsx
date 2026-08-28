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

/** Apple-style subscription sheet — monthly or yearly (3-day trial). */
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
      aria-label="Conclave Premier"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-md [-webkit-tap-highlight-color:transparent]"
        aria-label="Dismiss"
        onClick={onClose}
      />

      <div
        className="relative z-10 w-full max-w-none animate-[fadeUp_0.35s_ease-out_both] sm:max-w-[400px] sm:px-4 sm:pb-4"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="overflow-hidden rounded-t-[22px] border border-white/12 border-b-0 bg-[#1c1c1e] shadow-[0_-8px_40px_rgba(0,0,0,0.45)] sm:rounded-[28px] sm:border-b sm:shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
          <div className="flex justify-center pt-2.5 sm:hidden" aria-hidden>
            <span className="h-[5px] w-9 rounded-full bg-white/25" />
          </div>

          <div className="px-6 pb-2 pt-4 text-center sm:pt-6">
            <p className="font-display text-2xl font-semibold text-white">
              Con<span className="text-accent">clave</span>
            </p>
            <p className="mt-2 text-[13px] font-semibold tracking-tight text-white/55">
              Membership
            </p>
            <h2 className="mt-1 font-display text-[28px] font-semibold leading-tight tracking-tight text-white">
              {PREMIER_PLAN.name}
            </h2>
            <p className="mt-2 text-[15px] leading-snug text-white/60">
              {peerName
                ? `Unlock introductions to ${peerName.split(" ")[0]} and every higher tier.`
                : PREMIER_PLAN.tagline}
            </p>
          </div>

          <div className="mx-5 mt-4 flex rounded-xl bg-white/[0.06] p-1">
            <button
              type="button"
              onClick={() => setInterval("month")}
              className={`flex-1 rounded-[10px] py-2.5 text-[13px] font-semibold transition ${
                interval === "month" ? "bg-white text-black" : "text-white/55"
              }`}
            >
              Monthly · $20
            </button>
            <button
              type="button"
              onClick={() => setInterval("year")}
              className={`flex-1 rounded-[10px] py-2.5 text-[13px] font-semibold transition ${
                yearly ? "bg-white text-black" : "text-white/55"
              }`}
            >
              Yearly · $100
            </button>
          </div>

          <div className="mx-5 mt-3 rounded-2xl bg-white/[0.06] px-4 py-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[15px] font-medium text-white">
                {yearly ? "Yearly" : "Monthly"}
              </span>
              <span className="text-[15px] font-semibold text-white">
                {formatPremierPrice(interval)}
              </span>
            </div>
            {yearly && (
              <p className="mt-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-[13px] leading-snug text-ivory/80">
                3-day free trial — then $100/year. Cancel before day 3 and you won’t be charged.
              </p>
            )}
            <ul className="mt-3 space-y-2 border-t border-white/10 pt-3">
              {PREMIER_PLAN.features.map((f) => (
                <li key={f} className="flex gap-2 text-[13px] leading-snug text-white/70">
                  <span className="mt-0.5 text-white/40">✓</span>
                  <span>{f}</span>
                </li>
              ))}
              {yearly && (
                <li className="flex gap-2 text-[13px] leading-snug text-white/70">
                  <span className="mt-0.5 text-white/40">✓</span>
                  <span>Save vs paying monthly ($240/yr)</span>
                </li>
              )}
            </ul>
          </div>

          <div className="flex flex-col gap-2 px-5 pb-6 pt-5 sm:pb-5">
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
              className="mp-btn-lux min-h-[48px] w-full rounded-full bg-gradient-to-b from-accent-2 to-accent py-3.5 text-[17px] font-semibold text-ink [-webkit-tap-highlight-color:transparent]"
            >
              {yearly ? "Start 3-day free trial" : "Subscribe · $20/mo"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[48px] w-full rounded-full py-3 text-[17px] font-medium text-ivory/70 transition [-webkit-tap-highlight-color:transparent] active:bg-white/[0.06] hover:bg-white/[0.04] hover:text-ivory"
            >
              Not Now
            </button>
            <p className="px-2 pb-1 text-center text-[11px] leading-relaxed text-white/35">
              {yearly
                ? "Trial is free for 3 days. After that, $100 yearly until you cancel in Membership."
                : "Demo checkout — no real charge yet. Cancel anytime in Membership."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
