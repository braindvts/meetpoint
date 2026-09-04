"use client";

import { useState } from "react";
import BlackBadge from "@/components/BlackBadge";
import type { PaymentMethod } from "@/components/BookingPaymentSheet";
import { RESTAURANTS } from "@/lib/data";
import { findPerson } from "@/lib/directory";
import {
  BOOKING_FEE_PER_PERSON_USD,
  bookingHeadcount,
  bookingTotalUsd,
  formatUsd,
} from "@/lib/pricing";
import { formatPhoneDisplay, isValidPhone, maskPhone } from "@/lib/phone";
import { restaurantPhoto } from "@/lib/restaurantPhotos";
import { displayCuisine } from "@/lib/restaurantRating";
import { allAgreed } from "@/lib/store";
import StarRating from "@/components/StarRating";
import type { GroupChat } from "@/lib/types";

const PENDING_BOOKING_KEY = "conclave.pendingBooking";

export type PendingBooking = {
  chatId: string;
  meetupAt: string;
  phone: string;
  restaurantName: string;
};

export function savePendingBooking(data: PendingBooking): void {
  try {
    sessionStorage.setItem(PENDING_BOOKING_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function takePendingBooking(chatId: string): PendingBooking | null {
  try {
    const raw = sessionStorage.getItem(PENDING_BOOKING_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as PendingBooking;
    if (data.chatId !== chatId) return null;
    sessionStorage.removeItem(PENDING_BOOKING_KEY);
    return data;
  } catch {
    return null;
  }
}

interface Props {
  chat: GroupChat;
  myName: string;
  profilePhone?: string;
  onAgree: () => void;
  onBook: (meetupAt: string, phone: string, paymentMethod: PaymentMethod) => void;
  onClear?: () => void;
}

type Step = "idle" | "schedule" | "phone" | "pay";

function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultMeetupValue(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(19, 0, 0, 0);
  return toLocalInputValue(d);
}

function formatMeetup(isoOrLocal: string): string {
  const d = new Date(isoOrLocal);
  if (Number.isNaN(d.getTime())) return isoOrLocal;
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Schedule / phone / pay stay in the chat thread — no trapping modal. */
export default function TableProposalCard({
  chat,
  myName,
  profilePhone = "",
  onAgree,
  onBook,
  onClear,
}: Props) {
  const proposal = chat.tableProposal;
  const [step, setStep] = useState<Step>("idle");
  const [meetupLocal, setMeetupLocal] = useState(defaultMeetupValue);
  const [phone, setPhone] = useState(profilePhone);
  const [paying, setPaying] = useState(false);
  if (!proposal) return null;

  const voters = ["me", ...chat.memberIds];
  const blackPeers = chat.memberIds.filter((id) => findPerson(id)?.black);
  const agreed = proposal.agreedBy;
  const iAgreed = agreed.includes("me");
  const unanimous = allAgreed(chat);
  const headcount = bookingHeadcount(chat.memberIds);
  const total = bookingTotalUsd(chat.memberIds);
  const perPerson = formatUsd(BOOKING_FEE_PER_PERSON_USD);
  const meetupDate = new Date(meetupLocal);
  const scheduleValid =
    !!meetupLocal && !Number.isNaN(meetupDate.getTime()) && meetupDate.getTime() > Date.now();
  const phoneValid = isValidPhone(phone);
  const hadPhoneOnProfile = isValidPhone(profilePhone);
  const booking = step !== "idle" && !proposal.booked;

  function label(id: string) {
    if (id === "me") return myName.split(" ")[0];
    return findPerson(id)?.name.split(" ")[0] || "Member";
  }

  function cancelBookingFlow() {
    setStep("idle");
    setPaying(false);
  }

  async function payInline(method: PaymentMethod) {
    if (!proposal || !scheduleValid || !phoneValid || paying) return;
    setPaying(true);
    const meetupAt = new Date(meetupLocal).toISOString();
    const phoneFmt = formatPhoneDisplay(phone);
    const restaurantName = proposal.restaurantName;

    try {
      const { startBookingCheckout } = await import("@/lib/apiClient");
      savePendingBooking({
        chatId: chat.id,
        meetupAt,
        phone: phoneFmt,
        restaurantName,
      });
      const checkout = await startBookingCheckout({
        amountUsd: BOOKING_FEE_PER_PERSON_USD,
        label: `Table · ${restaurantName}`,
        chatId: chat.id,
        meetupAt,
        phone: phoneFmt,
      });
      if (checkout?.url) {
        window.location.href = checkout.url;
        return;
      }
      // No Stripe key → confirm locally
    } catch {
      /* fall through to local confirm */
    }

    onBook(meetupAt, phoneFmt, method);
    setPaying(false);
    setStep("idle");
  }

  const restaurantMatch = RESTAURANTS.find((r) => r.id === proposal.restaurantId);
  const ratingSource = restaurantMatch || {
    cuisine: proposal.cuisine,
    priceLevel: 3 as const,
  };

  // After booking, replace the big card with a quiet reminder
  if (proposal.booked) {
    return (
      <div className="border border-accent/30 bg-panel/70 px-4 py-3.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-accent-2">
          Coming soon
        </p>
        <p className="mt-1.5 font-display text-xl font-semibold tracking-tight text-ivory">
          Your table is on the way
        </p>
        <p className="mt-1 text-sm text-ivory/85">
          {proposal.restaurantName}
          {proposal.meetupAt ? ` · ${formatMeetup(proposal.meetupAt)}` : ""}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          Confirmation text
          {proposal.contactPhone ? ` → ${maskPhone(proposal.contactPhone)}` : ""}
          . Everyone in this booking got an app alert.
        </p>
      </div>
    );
  }

  const stepLabel =
    step === "schedule"
      ? "Set date & time"
      : step === "phone"
        ? "Phone for texts"
        : step === "pay"
          ? "Pay in chat"
          : unanimous
            ? "Ready to book"
            : "Proposed table";

  return (
    <div className="overflow-hidden border border-accent/35 bg-panel/80">
      <div className={`relative w-full overflow-hidden bg-black ${booking ? "aspect-[21/9]" : "aspect-[16/9]"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={restaurantPhoto(
            RESTAURANTS.find((r) => r.id === proposal.restaurantId) || {
              id: proposal.restaurantId,
              cuisine: proposal.cuisine,
            }
          )}
          alt={proposal.restaurantName}
          className="h-full w-full object-cover"
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/90 to-transparent"
          aria-hidden
        />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 px-3 pb-2.5">
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-accent-2">
              {stepLabel}
            </p>
            <h3 className="truncate font-display text-xl font-semibold text-ivory">
              {proposal.restaurantName}
            </h3>
          </div>
          {booking && (
            <button
              type="button"
              onClick={cancelBookingFlow}
              className="shrink-0 rounded-full border border-white/25 bg-black/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white"
            >
              Close
            </button>
          )}
        </div>
      </div>

      <div className="p-3.5">
        {blackPeers.length > 0 && (
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <BlackBadge size="xs" />
            <span className="text-[11px] text-muted">
              Business meeting with a BLACK member
            </span>
          </div>
        )}
        <p className="text-[11px] text-muted">
          {displayCuisine(proposal.cuisine)} · {proposal.city}
        </p>
        <div className="mt-1.5">
          <StarRating restaurant={ratingSource} />
        </div>
        <p className="mt-1 text-sm text-ivory/70">{proposal.vibe}</p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {voters.map((id) => {
            const yes = agreed.includes(id);
            return (
              <span
                key={id}
                className={`border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${
                  yes
                    ? "border-accent/40 bg-accent/10 text-accent-2"
                    : "border-line/70 text-muted"
                }`}
              >
                {label(id)} · {yes ? "Agreed" : "Pending"}
              </span>
            );
          })}
        </div>

        {step === "schedule" ? (
          <div className="mt-3 border border-line/60 bg-ink/50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
              When are you meeting?
            </p>
            <p className="mt-1 text-xs text-muted">Pick date & time here in the chat.</p>
            <input
              type="datetime-local"
              value={meetupLocal}
              min={toLocalInputValue(new Date())}
              onChange={(e) => setMeetupLocal(e.target.value)}
              className="mt-3 w-full border border-line/70 bg-transparent px-3 py-2.5 text-sm text-ivory outline-none focus:border-accent [color-scheme:dark]"
            />
            {!scheduleValid && meetupLocal && (
              <p className="mt-2 text-xs text-muted">Choose a time in the future.</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!scheduleValid}
                onClick={() => {
                  setPhone((p) => p || profilePhone);
                  setStep("phone");
                }}
                className="rounded-full bg-gradient-to-b from-accent-2 to-accent px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink disabled:opacity-40"
              >
                Continue
              </button>
              <button
                type="button"
                onClick={cancelBookingFlow}
                className="rounded-full border border-line px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : step === "phone" ? (
          <div className="mt-3 border border-line/60 bg-ink/50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
              {hadPhoneOnProfile ? "Confirm phone" : "Add phone for texts"}
            </p>
            <p className="mt-1 text-xs text-muted">
              We text reservation details to this number.
            </p>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              className="mt-3 w-full border border-line/70 bg-transparent px-3 py-2.5 text-sm text-ivory outline-none placeholder:text-muted/40 focus:border-accent"
            />
            {phone && !phoneValid && (
              <p className="mt-2 text-xs text-muted">Enter at least 10 digits.</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!phoneValid}
                onClick={() => setStep("pay")}
                className="rounded-full bg-gradient-to-b from-accent-2 to-accent px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink disabled:opacity-40"
              >
                Continue
              </button>
              <button
                type="button"
                onClick={() => setStep("schedule")}
                className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted"
              >
                Back
              </button>
              <button
                type="button"
                onClick={cancelBookingFlow}
                className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : step === "pay" ? (
          <div className="mt-3 border border-line/60 bg-ink/50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
              Pay in chat
            </p>
            <p className="mt-1 text-sm text-ivory/90">{formatMeetup(meetupLocal)}</p>
            <p className="mt-0.5 text-xs text-muted">Texts → {formatPhoneDisplay(phone)}</p>
            <p className="mt-2 font-display text-xl text-ivory">{perPerson} per person</p>
            <p className="text-xs text-muted">
              {headcount} people · {formatUsd(total)} total · Stripe when configured
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                disabled={paying || !scheduleValid || !phoneValid}
                onClick={() => payInline("apple-pay")}
                className="w-full rounded-full bg-white py-3 text-[13px] font-semibold text-black disabled:opacity-40"
              >
                {paying ? "Authorizing…" : `Pay ${perPerson} with Apple Pay`}
              </button>
              <button
                type="button"
                disabled={paying || !scheduleValid || !phoneValid}
                onClick={() => payInline("card")}
                className="w-full rounded-full border border-white/25 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-ivory disabled:opacity-40"
              >
                Pay with card instead
              </button>
              <button
                type="button"
                disabled={paying}
                onClick={cancelBookingFlow}
                className="py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted"
              >
                Cancel · back to chat
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {!iAgreed && (
              <button
                type="button"
                onClick={onAgree}
                className="rounded-full bg-gradient-to-b from-accent-2 to-accent px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink"
              >
                I agree
              </button>
            )}
            {unanimous && (
              <button
                type="button"
                onClick={() => setStep("schedule")}
                className="rounded-full bg-gradient-to-b from-accent-2 to-accent px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink"
              >
                Set time & book
              </button>
            )}
            {iAgreed && !unanimous && (
              <p className="self-center text-xs text-muted">Waiting for everyone to agree…</p>
            )}
            {onClear && (
              <button
                type="button"
                onClick={onClear}
                className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted"
              >
                Cancel proposal
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
