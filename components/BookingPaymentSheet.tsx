"use client";

import { useEffect, useMemo, useState } from "react";
import { BOOKING_FEE_PER_PERSON_USD, formatUsd } from "@/lib/pricing";

export type PaymentMethod = "apple-pay" | "card";

interface Props {
  open: boolean;
  restaurantName: string;
  meetupLabel: string;
  headcount: number;
  /** Your share — $5. */
  amountUsd?: number;
  onClose: () => void;
  onPaid: (method: PaymentMethod) => void;
}

function detectAppleDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const platform = (navigator as Navigator & { userAgentData?: { platform?: string } })
    .userAgentData?.platform;
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isMac = /Macintosh|Mac OS X/i.test(ua) || platform === "macOS";
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  return isIOS || (isMac && isSafari);
}

/** Apple Pay sheet on Apple devices; card checkout on other browsers. */
export default function BookingPaymentSheet({
  open,
  restaurantName,
  meetupLabel,
  headcount,
  amountUsd = BOOKING_FEE_PER_PERSON_USD,
  onClose,
  onPaid,
}: Props) {
  const apple = useMemo(() => detectAppleDevice(), []);
  const [mode, setMode] = useState<"apple" | "card">(apple ? "apple" : "card");
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(false);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  useEffect(() => {
    if (!open) {
      setPaying(false);
      setDone(false);
      return;
    }
    setMode(apple ? "apple" : "card");
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !paying) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, apple, paying, onClose]);

  if (!open) return null;

  const amount = formatUsd(amountUsd);
  const cardOk =
    cardName.trim().length > 1 &&
    cardNumber.replace(/\s/g, "").length >= 12 &&
    expiry.length >= 4 &&
    cvc.length >= 3;

  function finish(method: PaymentMethod) {
    setPaying(true);
    // Local authorize — Stripe / Apple Pay takes over once keys are set
    window.setTimeout(() => {
      setDone(true);
      window.setTimeout(() => {
        onPaid(method);
        setPaying(false);
        setDone(false);
      }, 700);
    }, 1100);
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Pay for booking"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-md [-webkit-tap-highlight-color:transparent]"
        aria-label="Dismiss"
        disabled={paying}
        onClick={() => !paying && onClose()}
      />

      <div
        className="relative z-10 w-full max-w-none animate-[fadeUp_0.35s_ease-out_both] sm:max-w-[400px] sm:px-4 sm:pb-4"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="overflow-hidden rounded-t-[22px] border border-white/12 border-b-0 bg-[#1c1c1e] shadow-[0_-12px_48px_rgba(0,0,0,0.55)] sm:rounded-[28px] sm:border-b">
          <div className="flex justify-center pt-2.5 sm:hidden" aria-hidden>
            <span className="h-[5px] w-9 rounded-full bg-white/25" />
          </div>

          <div className="px-6 pb-2 pt-4 text-center sm:pt-6">
            <p className="font-display text-xl font-semibold text-white">
              Con<span className="text-accent">clave</span>
            </p>
            <p className="mt-2 text-[12px] font-semibold tracking-tight text-white/50">
              Table fee
            </p>
            <h2 className="mt-1 font-display text-[26px] font-semibold text-white">{amount}</h2>
            <p className="mt-2 text-[14px] leading-snug text-white/60">
              {restaurantName}
              <br />
              <span className="text-white/45">{meetupLabel}</span>
            </p>
            <p className="mt-2 text-[12px] text-white/40">
              Your share · {formatUsd(BOOKING_FEE_PER_PERSON_USD)} of {headcount} people
            </p>
          </div>

          {/* Method tabs on browser; Apple defaults to Apple Pay */}
          <div className="mx-5 mt-3 flex rounded-xl bg-white/[0.06] p-1">
            <button
              type="button"
              disabled={paying}
              onClick={() => setMode("apple")}
              className={`flex-1 rounded-[10px] py-2 text-[13px] font-semibold transition ${
                mode === "apple" ? "bg-white text-black" : "text-white/55"
              }`}
            >
              {apple ? "Apple Pay" : "Apple Pay"}
            </button>
            <button
              type="button"
              disabled={paying}
              onClick={() => setMode("card")}
              className={`flex-1 rounded-[10px] py-2 text-[13px] font-semibold transition ${
                mode === "card" ? "bg-white text-black" : "text-white/55"
              }`}
            >
              Card
            </button>
          </div>

          <div className="px-5 pb-6 pt-4">
            {done ? (
              <div className="py-8 text-center">
                <p className="font-display text-2xl text-white">Paid</p>
                <p className="mt-1 text-sm text-white/50">Booking your table…</p>
              </div>
            ) : mode === "apple" ? (
              <div className="space-y-3">
                {!apple && (
                  <p className="rounded-xl bg-white/[0.05] px-3 py-2.5 text-[12px] leading-relaxed text-white/45">
                    On iPhone this uses Apple Pay. In this browser the sheet is stand-in — no card
                    is charged until Stripe is connected.
                  </p>
                )}
                <button
                  type="button"
                  disabled={paying}
                  onClick={() => finish("apple-pay")}
                  className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-black py-3.5 text-[17px] font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)] transition active:scale-[0.98] disabled:opacity-60"
                >
                  {paying ? (
                    <span className="text-white/70">Authorizing…</span>
                  ) : (
                    <>
                      <ApplePayMark />
                      <span>Pay</span>
                    </>
                  )}
                </button>
                {apple && (
                  <p className="text-center text-[11px] text-white/35">
                    Confirm with Face ID · Touch ID · or passcode
                  </p>
                )}
              </div>
            ) : (
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!cardOk || paying) return;
                  finish("card");
                }}
              >
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
                    Name on card
                  </span>
                  <input
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    autoComplete="cc-name"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 py-3 text-[15px] text-white outline-none focus:border-white/30"
                    placeholder="Jordan Smith"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
                    Card number
                  </span>
                  <input
                    value={cardNumber}
                    onChange={(e) =>
                      setCardNumber(
                        e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 16)
                          .replace(/(\d{4})(?=\d)/g, "$1 ")
                      )
                    }
                    inputMode="numeric"
                    autoComplete="cc-number"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 py-3 text-[15px] tracking-wider text-white outline-none focus:border-white/30"
                    placeholder="4242 4242 4242 4242"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
                      Expiry
                    </span>
                    <input
                      value={expiry}
                      onChange={(e) => {
                        const d = e.target.value.replace(/\D/g, "").slice(0, 4);
                        setExpiry(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
                      }}
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 py-3 text-[15px] text-white outline-none focus:border-white/30"
                      placeholder="MM/YY"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
                      CVC
                    </span>
                    <input
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 py-3 text-[15px] text-white outline-none focus:border-white/30"
                      placeholder="123"
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={!cardOk || paying}
                  className="mp-btn-lux mt-1 min-h-[52px] w-full rounded-full bg-gradient-to-b from-accent-2 to-accent py-3.5 text-[17px] font-semibold text-ink enabled:active:scale-[0.98] disabled:opacity-40"
                >
                  {paying ? "Processing…" : `Pay ${amount}`}
                </button>
                <p className="text-center text-[11px] text-white/35">
                  Browser checkout · no card is charged until Stripe is connected.
                </p>
              </form>
            )}

            {!done && (
              <button
                type="button"
                disabled={paying}
                onClick={onClose}
                className="mt-3 w-full py-2.5 text-[15px] font-medium text-ivory/70 transition hover:text-ivory disabled:opacity-40"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ApplePayMark() {
  return (
    <svg viewBox="0 0 50 20" className="h-5 w-auto" aria-hidden>
      <path
        fill="currentColor"
        d="M9.5 3.2c-.7.9-1.9 1.5-3 1.4-.1-1.1.4-2.3 1.1-3 .7-.8 2-1.4 3-1.5.1 1.2-.3 2.3-1.1 3.1zm1.1 1.6c-1.7-.1-3.1 1-3.9 1-.8 0-2-.9-3.3-.9-1.7 0-3.3 1-4.1 2.5-1.8 3.1-.5 7.6 1.2 10.1.9 1.2 1.9 2.6 3.2 2.5 1.3-.1 1.8-.8 3.3-.8s2 .8 3.3.8c1.4 0 2.2-1.2 3.1-2.4.9-1.4 1.3-2.8 1.3-2.9-.1 0-2.5-1-2.5-3.7 0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8h-.2z"
      />
      <path
        fill="currentColor"
        d="M20.2 4.4c1.5 0 2.9.8 3.7 2.1h.1V4.7h2.7v14.1h-2.7v-1.6h-.1c-.8 1.2-2.1 1.9-3.7 1.9-3 0-5.2-2.5-5.2-6.1 0-3.5 2.3-6 5.2-6zm.7 2.3c-1.8 0-3 1.5-3 3.7s1.2 3.7 3 3.7 3-1.5 3-3.7-1.2-3.7-3-3.7zM30.8 18.8c-2.6 0-4.3-1.4-4.3-3.5 0-2.1 1.6-3.3 4.5-3.6l3.1-.3v-.9c0-1.2-.8-1.9-2.2-1.9-1.2 0-2 .6-2.2 1.5h-2.7c.1-2.3 2.1-4 5-4 2.9 0 4.8 1.6 4.8 4.1v7.4h-2.7v-1.5h-.1c-.7 1.1-2 1.7-3.7 1.7zm.7-2.1c1.5 0 2.6-1 2.6-2.4v-1l-2.6.3c-1.4.2-2.1.7-2.1 1.6 0 .9.8 1.5 2.1 1.5zM42.2 4.4c3.1 0 5.2 2.4 5.2 6s-2.1 6.1-5.2 6.1c-1.6 0-2.9-.7-3.7-1.9h-.1v5.6h-2.8V4.7h2.8v1.7h.1c.8-1.2 2.1-2 3.7-2zm-.6 2.3c-1.8 0-3 1.5-3 3.7s1.2 3.7 3 3.7 3-1.5 3-3.7-1.2-3.7-3-3.7z"
      />
    </svg>
  );
}
