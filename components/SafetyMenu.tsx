"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ReportDialog from "@/components/ReportDialog";
import { showToast } from "@/lib/notify";
import { blockPeer } from "@/lib/store";

/**
 * Report and Block for a member card or chat.
 * Wired to the existing POST /api/report and POST /api/blocks routes.
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

  function block() {
    const first = peerName.split(" ")[0] || "this person";
    if (!confirm(`Block ${first}? They’ll leave your room and this chat.`)) return;
    blockPeer(peerId);
    setOpen(false);
    showToast("Blocked");
    onBlocked?.();
  }

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
          <button type="button" role="menuitem" className={`${item} text-ivory/70`} onClick={block}>
            Block
          </button>
        </div>,
        document.body
      ) : null}
      <ReportDialog
        open={reportOpen}
        peerId={peerId}
        peerName={peerName}
        onClose={() => setReportOpen(false)}
        onSubmitted={({ alsoBlocked }) => {
          if (alsoBlocked) onBlocked?.();
        }}
      />
    </div>
  );
}
