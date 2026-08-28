"use client";

import { useEffect, useRef, useState } from "react";

const SESSION_KEY = "conclave.splash.seen";

function alreadySeen(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return true;
  }
}

function markSeen() {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
}

export default function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const finished = useRef(false);

  useEffect(() => {
    if (alreadySeen()) return;

    setVisible(true);

    let hideTimer: number | undefined;
    const finish = () => {
      if (finished.current) return;
      finished.current = true;
      markSeen();
      setLeaving(true);
      hideTimer = window.setTimeout(() => setVisible(false), 380);
    };

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      finish();
      return () => {
        if (hideTimer) window.clearTimeout(hideTimer);
      };
    }

    const tOut = window.setTimeout(() => setLeaving(true), 1800);
    const tDone = window.setTimeout(finish, 2300);
    const tFailsafe = window.setTimeout(finish, 4000);

    return () => {
      window.clearTimeout(tOut);
      window.clearTimeout(tDone);
      window.clearTimeout(tFailsafe);
      if (hideTimer) window.clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`mp-splash fixed inset-0 z-[200] flex flex-col items-center justify-center bg-ink ${
        leaving ? "mp-splash-out" : ""
      }`}
      role="presentation"
      onClick={() => {
        if (finished.current) return;
        finished.current = true;
        markSeen();
        setLeaving(true);
        window.setTimeout(() => setVisible(false), 280);
      }}
    >
      <div
        className="pointer-events-none absolute h-56 w-56 rounded-full bg-accent/20 blur-3xl"
        aria-hidden
      />
      <div className="mp-splash-seal relative flex flex-col items-center px-8 text-center">
        <p className="mp-splash-word text-4xl font-semibold tracking-[0.06em] text-accent sm:text-5xl">
          CONCLAVE
        </p>
        <p className="mt-5 max-w-xs text-[15px] font-normal leading-snug text-ivory/70">
          The private network for ambitious people.
        </p>
      </div>
    </div>
  );
}
