"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  REPORT_CATEGORIES,
  REPORT_CATEGORY_LABEL,
  type ReportCategory,
} from "@/lib/reportLabels";
import { showToast } from "@/lib/notify";
import { loadBlockedIds, loadConnections } from "@/lib/store";

/**
 * Report and Block slots on a profile card.
 * Calls POST /api/report and POST /api/blocks by route.
 * Does not import lib/moderation.ts or lib/safetyRules.ts.
 */
export default function SafetyMenu({
  peerId,
  peerName,
  className = "",
  compact = false,
  onBlocked,
}: {
  peerId: string;
  peerName: string;
  className?: string;
  compact?: boolean;
  onBlocked?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) {
      const width = 160;
      setPos({
        top: rect.bottom + 6,
        left: Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8)),
      });
    }
    function onDoc(e: MouseEvent) {
      const target = e.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item = "flex w-full items-center px-3 py-2.5 text-left text-[13px] hover:bg-white/[0.06]";

  return (
    <div ref={rootRef} className={`relative ${className}`} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-label={`More actions for ${peerName}`}
        aria-haspopup="menu"
        aria-expanded={open}
        ref={btnRef}
        onClick={() => setOpen((value) => !value)}
        className={
          compact
            ? "grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-white/[0.06] hover:text-ivory"
            : "grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-black/50 text-ivory/80 hover:text-ivory"
        }
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
          <circle cx="5" cy="12" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="19" cy="12" r="1.6" />
        </svg>
      </button>
      {open && pos && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              style={{ position: "fixed", top: pos.top, left: pos.left, width: 160 }}
              className="z-[200] overflow-hidden rounded-lg border border-white/12 bg-[#141414] py-1"
            >
              <button
                type="button"
                role="menuitem"
                className={`${item} text-ivory`}
                onClick={() => {
                  setOpen(false);
                  setReportOpen(true);
                }}
              >
                Report
              </button>
              <button
                type="button"
                role="menuitem"
                className={`${item} text-ivory/70`}
                onClick={() => {
                  setOpen(false);
                  void blockMember(peerId, peerName, onBlocked);
                }}
              >
                Block
              </button>
            </div>,
            document.body
          )
        : null}
      {reportOpen ? (
        <ReportSlot
          titleId={titleId}
          peerId={peerId}
          peerName={peerName}
          onClose={() => setReportOpen(false)}
          onBlocked={onBlocked}
        />
      ) : null}
    </div>
  );
}

async function postRoute(path: string, body: unknown): Promise<{ ok: boolean; message: string; blockedIds?: string[] }> {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    if (res.status === 404) {
      return { ok: false, message: "That action isn’t available yet." };
    }
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      message?: string;
      blockedIds?: string[];
    };
    if (!res.ok || data.ok === false) {
      return { ok: false, message: data.error || "Couldn’t complete that. Try again." };
    }
    return { ok: true, message: data.message || "Done", blockedIds: data.blockedIds };
  } catch {
    return { ok: false, message: "Network error. Try again." };
  }
}

/** Keep this browser’s room in step with the block route. */
function hidePeerLocally(peerId: string, blockedIds?: string[]) {
  try {
    const ids =
      blockedIds && blockedIds.length > 0
        ? blockedIds
        : [...new Set([...loadBlockedIds(), peerId])];
    localStorage.setItem("meetpoint.blocked", JSON.stringify(ids));
    const connections = loadConnections().filter((row) => row.peerId !== peerId);
    localStorage.setItem("meetpoint.connections", JSON.stringify(connections));
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new CustomEvent("meetpoint:blocks-changed"));
  window.dispatchEvent(new CustomEvent("meetpoint:connections-changed"));
}

async function blockMember(peerId: string, peerName: string, onBlocked?: () => void) {
  const first = peerName.split(" ")[0] || "this person";
  if (!confirm(`Block ${first}? They’ll leave your room.`)) return;
  const result = await postRoute("/api/blocks", { peerId, action: "block" });
  if (!result.ok) {
    showToast(result.message);
    return;
  }
  hidePeerLocally(peerId, result.blockedIds);
  showToast("Blocked");
  onBlocked?.();
}

function ReportSlot({
  titleId,
  peerId,
  peerName,
  onClose,
  onBlocked,
}: {
  titleId: string;
  peerId: string;
  peerName: string;
  onClose: () => void;
  onBlocked?: () => void;
}) {
  const [category, setCategory] = useState<ReportCategory>("harassment");
  const [reason, setReason] = useState("");
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const first = peerName.split(" ")[0] || "this member";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = reason.trim();
    if (trimmed.length < 3) {
      setError("Add a short description.");
      return;
    }
    setBusy(true);
    setError("");
    const result = await postRoute("/api/report", {
      peerId,
      category,
      reason: trimmed,
      alsoBlock,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    if (alsoBlock) hidePeerLocally(peerId, result.blockedIds);
    showToast(result.message || "Report received.");
    if (alsoBlock) onBlocked?.();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[140] flex items-end justify-center bg-black/70 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="mp-modal-in w-full max-w-md border border-white/12 bg-[#12110f] p-5"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">Safety</p>
        <h2 id={titleId} className="mt-2 text-xl font-semibold text-ivory">
          Report {first}
        </h2>
        <p className="mt-1 text-[13px] leading-snug text-muted">
          Reports stay private. They won’t see who filed this.
        </p>
        <fieldset className="mt-4 space-y-2">
          <legend className="text-[11px] uppercase tracking-[0.2em] text-muted">Reason</legend>
          {REPORT_CATEGORIES.map((item) => (
            <label key={item} className="flex items-center gap-2 text-[13px] text-ivory">
              <input
                type="radio"
                name="report-category"
                value={item}
                checked={category === item}
                onChange={() => setCategory(item)}
                className="accent-[#d4c4a8]"
              />
              {REPORT_CATEGORY_LABEL[item]}
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
            className="mt-2 w-full resize-none border border-white/12 bg-transparent px-3 py-2.5 text-sm normal-case tracking-normal text-ivory outline-none focus:border-accent"
          />
        </label>
        <label className="mt-3 flex items-start gap-3 border border-white/12 px-3 py-3 text-[13px] text-ivory">
          <input
            type="checkbox"
            checked={alsoBlock}
            onChange={(e) => setAlsoBlock(e.target.checked)}
            className="mt-0.5 accent-[#d4c4a8]"
          />
          <span>
            Also block {first}
            <span className="mt-0.5 block text-[12px] text-muted">Removes them from your room.</span>
          </span>
        </label>
        {error ? (
          <p className="mt-3 text-[13px] text-accent-2" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="min-h-11 flex-1 border border-white/12 text-[12px] font-medium text-muted disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="mp-btn-lux min-h-11 flex-1 text-[12px] font-semibold disabled:opacity-40"
          >
            {busy ? "Sending…" : "Submit report"}
          </button>
        </div>
      </form>
    </div>
  );
}
