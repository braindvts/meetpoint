"use client";

import { useEffect, useRef, useState } from "react";
import { pickConclaveLine } from "@/lib/lines";

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

/**
 * First open only. Word + unique line + Montevere Co.
 */
export default function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [line] = useState(() => pickConclaveLine());
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

    const tOut = window.setTimeout(() => setLeaving(true), 2200);
    const tDone = window.setTimeout(finish, 2700);
    const tFailsafe = window.setTimeout(finish, 4200);

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
      <div className="mp-splash-seal relative flex flex-col items-center px-8 text-center">
        <p className="mp-kicker">
          By introduction only
        </p>
        <p className="mp-splash-word mt-5 font-display text-5xl font-semibold tracking-tight text-ivory sm:text-6xl">
          Con<span className="text-accent">clave</span>
        </p>
        <p className="mt-5 max-w-sm font-display text-xl italic leading-snug text-ivory/80 sm:text-2xl">
          {line}
        </p>
      </div>
      <p className="absolute bottom-10 text-[10px] font-semibold uppercase tracking-[0.36em] text-muted/70">
        Powered by Montevere Co.
      </p>
    </div>
  );
}
