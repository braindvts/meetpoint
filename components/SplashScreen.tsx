"use client";

import { useEffect, useRef, useState } from "react";
import ConclaveLogo from "@/components/ConclaveLogo";

const SESSION_KEY = "conclave.splash.seen";

function alreadySeen(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return true; // if storage blocked, skip splash so the app never sticks
  }
}

function markSeen() {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
}

/**
 * First open only. Always dismisses — never blocks the app underneath.
 */
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
      hideTimer = window.setTimeout(() => setVisible(false), 320);
    };

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      finish();
      return () => {
        if (hideTimer) window.clearTimeout(hideTimer);
      };
    }

    const tOut = window.setTimeout(() => setLeaving(true), 1100);
    const tDone = window.setTimeout(finish, 1500);
    /** Hard failsafe — never leave the user stuck on splash */
    const tFailsafe = window.setTimeout(finish, 2800);

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
      <div className="mp-splash-seal relative flex flex-col items-center">
        <span className="mp-splash-ring" aria-hidden />
        <ConclaveLogo size={72} variant="hero" />
        <p className="mp-splash-word mt-6 text-3xl font-semibold tracking-tight text-ivory">
          Con<span className="text-accent">clave</span>
        </p>
      </div>
    </div>
  );
}
