"use client";

import Link from "next/link";
import { useEffect, useId, useState, useSyncExternalStore } from "react";
import {
  clearNotices,
  emptyNoticeSnapshot,
  loadNoticeState,
  markAllNoticesRead,
  markNoticeRead,
  subscribeNotices,
  unreadCount,
  type Notice,
} from "@/lib/notifications";

function useNotices() {
  return useSyncExternalStore(subscribeNotices, loadNoticeState, emptyNoticeSnapshot);
}

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}

function NoticeList({
  items,
  onOpen,
}: {
  items: Notice[];
  onOpen?: () => void;
}) {
  if (!items.length) {
    return (
      <div className="px-5 py-10 text-center">
        <span className="mx-auto mb-4 block h-px w-8 bg-accent/50" />
        <p className="text-base font-medium tracking-tight text-ivory">You’re up to date</p>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted">
          When someone accepts your introduction, or a gathering is coming up, it shows up here.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-white/[0.06]">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={item.href}
            onClick={() => {
              markNoticeRead(item.id);
              onOpen?.();
            }}
            className="flex gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.03]"
          >
            <span
              className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${item.read ? "bg-transparent" : "bg-accent"}`}
              aria-hidden="true"
            />
            <span className="min-w-0">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
                {item.eyebrow}
              </span>
              <span className="mt-1 block truncate text-[15px] font-medium text-ivory">
                {item.title}
              </span>
              <span className="mt-0.5 block text-[13px] leading-snug text-muted">{item.body}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function NotificationFeed({ onOpen }: { onOpen?: () => void }) {
  const state = useNotices();
  const unread = unreadCount(state);

  return (
    <div>
      <div className="flex items-center justify-end gap-2 border-b border-white/[0.06] px-4 py-2">
        <button
          type="button"
          onClick={() => markAllNoticesRead()}
          disabled={unread === 0}
          className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-accent disabled:text-muted/50"
        >
          Mark read
        </button>
        <button
          type="button"
          onClick={() => clearNotices()}
          disabled={state.items.length === 0}
          className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted disabled:text-muted/40"
        >
          Clear
        </button>
      </div>
      <NoticeList items={state.items} onOpen={onOpen} />
    </div>
  );
}

export default function NotificationBell({ active = false }: { active?: boolean }) {
  const state = useNotices();
  const unread = unreadCount(state);
  const panelId = useId();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const label =
    unread > 0
      ? `Notifications, ${unread} unread`
      : "Notifications";

  return (
    <>
      <button
        type="button"
        className={`mp-site-nav-link relative grid h-9 w-9 shrink-0 place-items-center ${open || active ? "is-active" : ""}`}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <BellIcon />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 grid min-h-[1rem] min-w-[1rem] place-items-center rounded-full bg-accent px-1 text-[9px] font-bold leading-none text-ink">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            className="fixed inset-0 top-14 z-[90] bg-black/55"
            onClick={() => setOpen(false)}
          />
          <div
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${panelId}-title`}
            className="fixed right-3 top-[3.65rem] z-[95] flex max-h-[min(32rem,calc(100dvh-5rem))] w-[min(24rem,calc(100vw-1.5rem))] flex-col overflow-hidden border border-accent/25 bg-[#050505] shadow-[0_18px_50px_rgba(0,0,0,0.45)]"
          >
            <div className="flex items-start justify-between gap-3 border-b border-white/[0.08] px-4 py-3">
              <div>
                <h2 id={`${panelId}-title`} className="text-base font-medium tracking-tight text-ivory">
                  Notifications
                </h2>
                <p className="mt-0.5 text-[12px] text-muted">
                  Acceptances and gatherings on the calendar
                </p>
              </div>
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="shrink-0 pt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-accent"
              >
                View all
              </Link>
            </div>
            <div className="min-h-0 overflow-y-auto">
              <NotificationFeed onOpen={() => setOpen(false)} />
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
