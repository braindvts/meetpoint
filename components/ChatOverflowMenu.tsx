"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ReportDialog from "@/components/ReportDialog";
import { clearChatMute, isChatMuted, setChatMuted } from "@/lib/chatMute";
import { showToast } from "@/lib/notify";
import { blockPeer, deleteChat } from "@/lib/store";
import type { GroupChat } from "@/lib/types";

type Props = {
  chat: GroupChat;
  /** Direct chat peer id (first member). */
  peerId?: string;
  peerName?: string;
  isGroup: boolean;
  onEditGroup?: () => void;
  /** After leave / delete / block — leave the thread. */
  onLeft?: () => void;
  /** Smaller trigger for the inbox row. */
  compact?: boolean;
};

type MenuPos = { top: number; left: number; openUp: boolean };

/**
 * Chat overflow (⋯) — mute, leave/delete, and for DMs report / block.
 * Menu is portaled so scroll parents can’t clip it.
 */
export default function ChatOverflowMenu({
  chat,
  peerId,
  peerName,
  isGroup,
  onEditGroup,
  onLeft,
  compact = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [pos, setPos] = useState<MenuPos | null>(null);
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const sync = () => setMuted(isChatMuted(chat.id));
    sync();
    window.addEventListener("meetpoint:mute-changed", sync);
    return () => window.removeEventListener("meetpoint:mute-changed", sync);
  }, [chat.id]);

  function placeMenu() {
    const btn = btnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const menuW = 184;
    const gap = 6;
    const estimatedH = isGroup ? 160 : 200;
    const spaceBelow = window.innerHeight - r.bottom;
    const openUp = spaceBelow < estimatedH + 12 && r.top > spaceBelow;

    // List rows: open into the main pane (right of the trigger) so the menu
    // isn’t cramped inside the narrow inbox rail.
    let left: number;
    if (compact) {
      const rightSide = r.right + gap;
      const fitsRight = rightSide + menuW <= window.innerWidth - 8;
      left = fitsRight
        ? rightSide
        : Math.max(8, r.left - menuW - gap);
    } else {
      left = Math.min(
        Math.max(8, r.right - menuW),
        window.innerWidth - menuW - 8
      );
    }

    const top = openUp ? r.top - gap : r.bottom + gap;
    setPos({ top, left, openUp });
  }

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    placeMenu();
    function onReposition() {
      placeMenu();
    }
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isGroup, compact]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || menuRef.current?.contains(t)) return;
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

  function toast(message: string) {
    showToast(message);
  }

  function muteToggle() {
    const next = !muted;
    setChatMuted(chat.id, next);
    setMuted(next);
    setOpen(false);
    toast(next ? "Chat muted" : "Chat unmuted");
  }

  function leaveOrDelete() {
    const label = isGroup ? "Leave this group?" : "Delete this chat?";
    if (!confirm(label)) return;
    deleteChat(chat.id);
    clearChatMute(chat.id);
    setOpen(false);
    toast(isGroup ? "Left group" : "Chat deleted");
    onLeft?.();
  }

  function doBlock() {
    if (!peerId) return;
    if (
      !confirm(
        `Block ${peerName || "this person"}? They’ll be removed from your Circle and this chat.`
      )
    ) {
      return;
    }
    blockPeer(peerId);
    deleteChat(chat.id);
    clearChatMute(chat.id);
    setOpen(false);
    toast("Blocked");
    onLeft?.();
  }

  const item =
    "flex w-full items-center px-3 py-2.5 text-left text-[13px] transition hover:bg-white/[0.06]";

  const menu =
    open && pos && mounted
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              position: "fixed",
              top: pos.openUp ? undefined : pos.top,
              bottom: pos.openUp ? window.innerHeight - pos.top : undefined,
              left: pos.left,
              width: 184,
            }}
            className="z-[200] overflow-hidden rounded-xl border border-white/12 bg-[#0c0c0c] py-1 shadow-[0_16px_40px_rgba(0,0,0,0.65)]"
          >
            <button type="button" role="menuitem" className={`${item} text-ivory`} onClick={muteToggle}>
              {muted ? "Unmute" : "Mute"}
            </button>

            {isGroup && onEditGroup ? (
              <button
                type="button"
                role="menuitem"
                className={`${item} text-ivory`}
                onClick={() => {
                  setOpen(false);
                  onEditGroup();
                }}
              >
                Edit group
              </button>
            ) : null}

            {!isGroup && peerId ? (
              <>
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
                  className={`${item} text-red-300/90`}
                  onClick={doBlock}
                >
                  Block
                </button>
              </>
            ) : null}

            <div className="my-1 border-t border-white/[0.08]" />

            <button
              type="button"
              role="menuitem"
              className={`${item} text-red-300/90`}
              onClick={leaveOrDelete}
            >
              {isGroup ? "Leave group" : "Delete chat"}
            </button>
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={btnRef}
        type="button"
        aria-label="Chat options"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={
          compact
            ? "grid h-7 w-7 place-items-center rounded-md text-muted transition hover:bg-white/[0.06] hover:text-ivory"
            : "grid h-9 w-9 place-items-center rounded-lg border border-white/12 text-ivory/80 transition hover:border-accent/40 hover:text-accent"
        }
      >
        <svg
          viewBox="0 0 24 24"
          className={compact ? "h-3.5 w-3.5" : "h-4 w-4"}
          fill="currentColor"
          aria-hidden
        >
          <circle cx="5" cy="12" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="19" cy="12" r="1.6" />
        </svg>
      </button>

      {menu}

      {!isGroup && peerId && peerName ? (
        <ReportDialog
          open={reportOpen}
          peerId={peerId}
          peerName={peerName}
          onClose={() => setReportOpen(false)}
          onSubmitted={({ alsoBlocked }) => {
            if (alsoBlocked) {
              deleteChat(chat.id);
              clearChatMute(chat.id);
              onLeft?.();
            }
          }}
        />
      ) : null}
    </div>
  );
}
