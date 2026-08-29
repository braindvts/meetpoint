"use client";

import { useEffect, useState } from "react";
import { ensureNotifyPermission } from "@/lib/notify";

const KEY = "conclave.notify.asked";

/** Soft one-time prompt for browser notifications (table / intro alerts). */
export default function NotifyPrompt() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (window.location.search.includes("shot=1")) return;
    if (typeof window === "undefined" || typeof Notification === "undefined") return;
    try {
      if (localStorage.getItem(KEY) === "1") return;
    } catch {
      return;
    }
    if (Notification.permission !== "default") return;
    const t = window.setTimeout(() => setOpen(true), 4500);
    return () => window.clearTimeout(t);
  }, []);

  if (!open) return null;

  async function enable() {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
    await ensureNotifyPermission();
  }

  function dismiss() {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  }

  return (
    <div className="fixed inset-x-0 bottom-[5.5rem] z-[90] px-3 sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-sm sm:px-0">
      <div className="border border-accent/25 bg-panel/95 p-4 shadow-[0_16px_48px_rgba(0,0,0,0.55)] backdrop-blur-md">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">
          Alerts
        </p>
        <p className="mt-1.5 text-sm leading-snug text-ivory">
          Get notified when someone accepts an introduction or a table is confirmed.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={enable}
            className="flex-1 bg-gradient-to-b from-accent-2 to-accent py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink"
          >
            Enable
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="flex-1 border border-line py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
