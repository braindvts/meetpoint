"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  document.documentElement.classList.remove("mp-boot-splash");
}

/**
 * First-open loading seal — brand, atmosphere, then the room.
 * Once per browser tab session (skipped for screenshots / reduced motion).
 */
export default function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const finished = useRef(false);
  const line = useMemo(() => pickConclaveLine(), []);

  useEffect(() => {
    if (window.location.search.includes("shot=1")) {
      document.body.setAttribute("data-shot", "1");
      markSeen();
      return;
    }
    if (window.location.pathname.startsWith("/story")) {
      markSeen();
      return;
    }
    if (alreadySeen()) {
      document.documentElement.classList.remove("mp-boot-splash");
      return;
    }

    setVisible(true);
    document.documentElement.classList.add("mp-boot-splash");

    let hideTimer: number | undefined;
    const finish = () => {
      if (finished.current) return;
      finished.current = true;
      markSeen();
      setLeaving(true);
      hideTimer = window.setTimeout(() => {
        setVisible(false);
        document.documentElement.classList.remove("mp-boot-splash");
      }, 520);
    };

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      finish();
      return () => {
        if (hideTimer) window.clearTimeout(hideTimer);
      };
    }

    const tOut = window.setTimeout(() => setLeaving(true), 2400);
    const tDone = window.setTimeout(finish, 2900);
    const tFailsafe = window.setTimeout(finish, 4500);

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
      className={`mp-splash fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden bg-ink ${
        leaving ? "mp-splash-out" : ""
      }`}
      role="status"
      aria-live="polite"
      aria-label="Loading Conclave"
      onClick={() => {
        if (finished.current) return;
        finished.current = true;
        markSeen();
        setLeaving(true);
        window.setTimeout(() => {
          setVisible(false);
          document.documentElement.classList.remove("mp-boot-splash");
        }, 320);
      }}
    >
      {/* Atmosphere */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="mp-splash-glow absolute left-1/2 top-[42%] h-[min(70vw,28rem)] w-[min(70vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/18 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#050505_72%)]" />
        <div className="mp-splash-grain absolute inset-0 opacity-[0.07]" />
      </div>

      <div className="mp-splash-seal relative flex flex-col items-center px-8 text-center">
        <span className="mp-splash-ring" aria-hidden />
        <span className="mp-splash-ring mp-splash-ring--outer" aria-hidden />

        <p className="mp-splash-mark mb-5 text-[11px] font-semibold uppercase tracking-[0.42em] text-accent/80">
          ◆
        </p>

        <h1 className="mp-splash-word font-display text-[clamp(2.5rem,9vw,4.75rem)] font-semibold leading-none tracking-[0.14em] text-accent">
          CONCLAVE
        </h1>

        <span className="mp-splash-line mt-7 h-px w-24 origin-center bg-gradient-to-r from-transparent via-accent to-transparent" />

        <p className="mp-splash-tag mt-6 max-w-[18rem] text-[14px] leading-relaxed text-ivory/70 sm:max-w-sm sm:text-[15px]">
          {line}
        </p>

        <div className="mp-splash-bar mt-10 h-[2px] w-36 overflow-hidden rounded-full bg-white/10">
          <span className="mp-splash-bar-fill block h-full w-full origin-left rounded-full bg-gradient-to-r from-accent/40 via-accent to-accent/40" />
        </div>
        <p className="mp-splash-tag mt-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-muted">
          Opening the room
        </p>
      </div>
    </div>
  );
}
