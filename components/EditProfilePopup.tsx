"use client";

import { useEffect } from "react";
import Link from "next/link";
import MatchCard from "@/components/MatchCard";
import { selfCardMatch } from "@/lib/profileCard";
import type { MyProfile } from "@/lib/types";

interface Props {
  open: boolean;
  profile: MyProfile;
  onClose: () => void;
  /** Where Edit takes them (default /profile). */
  editHref?: string;
}

/** Mid-size popup with your public card — not a full-screen sheet. */
export default function EditProfilePopup({
  open,
  profile,
  onClose,
  editHref = "/profile",
}: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-label="Your card"
    >
      <button
        type="button"
        className="mp-backdrop-in absolute inset-0 bg-black/70 [-webkit-tap-highlight-color:transparent]"
        aria-label="Dismiss"
        onClick={onClose}
      />

      <div className="mp-modal-in relative z-10 flex max-h-[78dvh] w-full max-w-[340px] flex-col overflow-hidden border border-white/12 bg-[#141414] shadow-[0_24px_70px_rgba(0,0,0,0.7)]">
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-3.5 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent-2">
            Your card
          </p>
          <button
            type="button"
            onClick={onClose}
            className="text-[12px] text-muted transition hover:text-ivory"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
          <MatchCard match={selfCardMatch(profile)} preview />
        </div>

        <div className="shrink-0 space-y-2 border-t border-white/10 px-3.5 py-3">
          <p className="text-center text-[11px] text-muted">
            This is how you appear in The Room.
          </p>
          <Link
            href={editHref}
            onClick={onClose}
            className="mp-btn-lux block w-full rounded-full bg-gradient-to-b from-accent-2 to-accent py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-ink"
          >
            Edit profile
          </Link>
        </div>
      </div>
    </div>
  );
}
