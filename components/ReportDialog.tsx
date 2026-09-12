"use client";

import { useEffect, useState } from "react";
import {
  REPORT_CATEGORIES,
  REPORT_CATEGORY_LABEL,
  type ReportCategory,
} from "@/lib/reportLabels";

interface Props {
  open: boolean;
  peerId: string;
  peerName: string;
  onClose: () => void;
  onSubmitted?: (result: { alsoBlocked: boolean }) => void;
}

function toast(message: string) {
  window.dispatchEvent(new CustomEvent("meetpoint:toast", { detail: { message } }));
}

/** Member report form — category, details, optional block. */
export default function ReportDialog({
  open,
  peerId,
  peerName,
  onClose,
  onSubmitted,
}: Props) {
  const [category, setCategory] = useState<ReportCategory>("harassment");
  const [reason, setReason] = useState("");
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setCategory("harassment");
    setReason("");
    setAlsoBlock(true);
    setError("");
    setBusy(false);
  }, [open, peerId]);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = reason.trim();
    if (trimmed.length < 3) {
      setError("Please add a short description (at least a few words).");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ peerId, category, reason: trimmed, alsoBlock }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
        alsoBlocked?: boolean;
      };
      if (!data.ok) {
        setError(data.error || "Could not send report. Sign in and try again.");
        return;
      }
      if (alsoBlock) {
        const { blockPeer } = await import("@/lib/store");
        blockPeer(peerId);
      }
      toast(data.message || "Report received. We’ll review it.");
      onSubmitted?.({ alsoBlocked: !!data.alsoBlocked });
      onClose();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const first = peerName.split(" ")[0] || "this member";

  return (
    <div
      className="fixed inset-0 z-[140] flex items-end justify-center bg-black/70 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <form
        onSubmit={submit}
        className="mp-modal-in w-full max-w-md border border-line bg-[#12110f] p-5 shadow-2xl"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">
          Safety
        </p>
        <h2 id="report-title" className="mt-2 text-xl font-semibold text-ivory">
          Report {first}
        </h2>
        <p className="mt-1 text-[13px] leading-snug text-muted">
          Tell us what happened. Reports are private — they won’t see who filed
          this.
        </p>

        <fieldset className="mt-4 space-y-2">
          <legend className="text-[11px] uppercase tracking-[0.2em] text-muted">
            Reason
          </legend>
          {REPORT_CATEGORIES.map((c) => (
            <label
              key={c}
              className={`flex cursor-pointer items-center gap-3 border px-3 py-2.5 text-[13px] transition ${
                category === c
                  ? "border-accent/50 bg-accent/[0.08] text-ivory"
                  : "border-line text-muted hover:border-white/20"
              }`}
            >
              <input
                type="radio"
                name="category"
                value={c}
                checked={category === c}
                onChange={() => setCategory(c)}
                className="accent-[#d4c4a8]"
              />
              {REPORT_CATEGORY_LABEL[c]}
            </label>
          ))}
        </fieldset>

        <label className="mt-4 block text-[11px] uppercase tracking-[0.2em] text-muted">
          Details
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={500}
            required
            placeholder="What happened? Include context if you can."
            className="mt-2 w-full resize-none border border-line bg-ink px-3 py-2.5 text-sm text-ivory outline-none focus:border-accent"
          />
        </label>
        <p className="mt-1 text-right text-[11px] text-muted">{reason.length}/500</p>

        <label className="mt-2 flex cursor-pointer items-start gap-3 border border-line px-3 py-3 text-[13px] text-ivory">
          <input
            type="checkbox"
            checked={alsoBlock}
            onChange={(e) => setAlsoBlock(e.target.checked)}
            className="mt-0.5 accent-[#d4c4a8]"
          />
          <span>
            Also block {first}
            <span className="mt-0.5 block text-[12px] text-muted">
              Removes them from your room and ends the connection.
            </span>
          </span>
        </label>

        {error && <p className="mt-3 text-[13px] text-red-300/90">{error}</p>}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="flex-1 border border-line py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="flex-1 bg-ivory py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink disabled:opacity-40"
          >
            {busy ? "Sending…" : "Submit report"}
          </button>
        </div>
      </form>
    </div>
  );
}
