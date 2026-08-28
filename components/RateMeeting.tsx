"use client";

import { useState } from "react";
import { getRatingForPeer, saveMeetingRating } from "@/lib/store";

const QUESTIONS: {
  key: "showedUp" | "professional" | "valuable" | "wouldMeetAgain";
  label: string;
}[] = [
  { key: "showedUp", label: "Showed up" },
  { key: "professional", label: "Professional" },
  { key: "valuable", label: "Valuable conversation" },
  { key: "wouldMeetAgain", label: "Would meet again" },
];

interface Props {
  peerId: string;
  peerName: string;
  onSaved?: () => void;
}

export default function RateMeeting({ peerId, peerName, onSaved }: Props) {
  const existing = getRatingForPeer(peerId);
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState({
    showedUp: existing?.showedUp ?? true,
    professional: existing?.professional ?? true,
    valuable: existing?.valuable ?? true,
    wouldMeetAgain: existing?.wouldMeetAgain ?? true,
  });
  const [saved, setSaved] = useState(!!existing);

  function submit() {
    saveMeetingRating({ peerId, ...answers });
    setSaved(true);
    setOpen(false);
    onSaved?.();
  }

  if (saved && !open) {
    return (
      <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-muted">
        Standing recorded for {peerName.split(" ")[0]}
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-accent-2 underline decoration-accent/40 underline-offset-4 transition hover:text-ivory"
      >
        Rate this meeting
      </button>
    );
  }

  return (
    <div className="relative mt-5 border border-line/70 bg-ink/50 p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-accent">
        After the table
      </p>
      <p className="mt-2 font-display text-xl font-semibold text-ivory">
        How was dinner with {peerName.split(" ")[0]}?
      </p>
      <div className="mt-5 space-y-3">
        {QUESTIONS.map((q) => (
          <div key={q.key} className="flex items-center justify-between gap-4">
            <span className="text-sm text-ivory/90">{q.label}</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAnswers((a) => ({ ...a, [q.key]: true }))}
                className={`border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] transition ${
                  answers[q.key]
                    ? "border-accent/50 bg-accent/10 text-accent-2"
                    : "border-line text-muted hover:text-ivory"
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setAnswers((a) => ({ ...a, [q.key]: false }))}
                className={`border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] transition ${
                  !answers[q.key]
                    ? "border-ivory/40 bg-ivory/10 text-ivory"
                    : "border-line text-muted hover:text-ivory"
                }`}
              >
                No
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={submit}
          className="rounded-full bg-gradient-to-b from-accent-2 to-accent px-6 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink transition hover:brightness-110"
        >
          Submit standing
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted transition hover:text-ivory"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
