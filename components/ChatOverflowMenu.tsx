"use client";

import { useEffect, useRef, useState } from "react";
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
};

/**
 * Chat overflow (⋯) — mute, leave/delete, and for DMs report / block.
 */
export default function ChatOverflowMenu({
  chat,
  peerId,
  peerName,
  isGroup,
  onEditGroup,
  onLeft,
}: Props) {
  const [open, setOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => setMuted(isChatMuted(chat.id));
    sync();
    window.addEventListener("meetpoint:mute-changed", sync);
    return () => window.removeEventListener("meetpoint:mute-changed", sync);
  }, [chat.id]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
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

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-label="Chat options"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="grid h-9 w-9 place-items-center rounded-lg border border-white/12 text-ivory/80 transition hover:border-accent/40 hover:text-accent"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
          <circle cx="5" cy="12" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="19" cy="12" r="1.6" />
        </svg>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] z-40 min-w-[11.5rem] overflow-hidden rounded-xl border border-white/12 bg-[#0c0c0c] py-1 shadow-[0_16px_40px_rgba(0,0,0,0.65)]"
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
        </div>
      ) : null}

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
