"use client";

import { useEffect, useState } from "react";

/** Lightweight toasts — e.g. when a demo member accepts an introduction. */
export default function ToastHost() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const onToast = (e: Event) => {
      const detail = (e as CustomEvent<{ message?: string }>).detail;
      if (!detail?.message) return;
      setMessage(detail.message);
    };
    window.addEventListener("meetpoint:toast", onToast);
    return () => window.removeEventListener("meetpoint:toast", onToast);
  }, []);

  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(() => setMessage(null), 4200);
    return () => window.clearTimeout(t);
  }, [message]);

  if (!message) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-[4.75rem] z-[90] flex justify-center px-4 sm:bottom-8"
      role="status"
    >
      <div className="mp-toast-in pointer-events-auto max-w-sm border border-white/15 bg-[#1c1c1e] px-4 py-3 text-center text-[12px] leading-snug text-ivory shadow-[0_12px_40px_rgba(0,0,0,0.55)]">
        {message}
      </div>
    </div>
  );
}
