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
 * Pass ?splash=1 to force it again.
 */
export default function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const finished = useRef(false);
  const line = useMemo(() => pickConclaveLine(), []);

  useEffect(() => {
    const force = window.location.search.includes("splash=1");
    if (window.location.search.includes("shot=1")) {
      document.body.setAttribute("data-shot", "1");
      markSeen();
      return;
    }
    if (window.location.pathname.startsWith("/story")) {
      markSeen();
      return;
    }
    if (!force && alreadySeen()) {
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
      }, 700);
    };

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      finish();
      return () => {
        if (hideTimer) window.clearTimeout(hideTimer);
      };
    }

    const tOut = window.setTimeout(() => setLeaving(true), 3800);
    const tDone = window.setTimeout(finish, 4400);
    const tFailsafe = window.setTimeout(finish, 6500);

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
        }, 420);
      }}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="mp-splash-glow absolute left-[28%] top-[30%] h-[22rem] w-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/14 blur-3xl" />
        <div className="mp-splash-glow mp-splash-glow--late absolute right-[18%] top-[58%] h-[18rem] w-[18rem] translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_10%,#050505_78%)]" />
        <div className="mp-splash-grain absolute inset-0 opacity-[0.06]" />
        <div className="mp-splash-vignette absolute inset-0" />
      </div>

      <div className="mp-splash-seal relative flex flex-col items-center px-8 text-center">
        <span className="mp-splash-ring" aria-hidden />
        <span className="mp-splash-ring mp-splash-ring--outer" aria-hidden />

        <p className="mp-splash-mark text-[10px] font-semibold uppercase tracking-[0.48em] text-accent/75">
          Private network
        </p>

        <div className="mp-splash-rule my-5 h-10 w-px bg-gradient-to-b from-transparent via-accent to-transparent" />

        <h1 className="mp-splash-word font-display text-[clamp(2.75rem,10vw,5.25rem)] font-semibold leading-[0.92] tracking-[0.16em] text-accent">
          CONCLAVE
        </h1>

        <span className="mp-splash-line mt-8 h-px w-32 origin-center bg-gradient-to-r from-transparent via-accent/90 to-transparent" />

        <p className="mp-splash-tag mt-7 max-w-[19rem] text-[15px] leading-relaxed text-ivory/72 sm:max-w-md sm:text-base">
          {line}
        </p>

        <div className="mp-splash-bar mt-12 h-[2px] w-44 overflow-hidden rounded-full bg-white/[0.08] sm:w-52">
          <span className="mp-splash-bar-fill block h-full w-full origin-left rounded-full bg-gradient-to-r from-accent/30 via-accent-2 to-accent/30" />
        </div>
        <p className="mp-splash-caption mt-5 text-[10px] font-semibold uppercase tracking-[0.32em] text-muted">
          Setting the table
        </p>
      </div>
    </div>
  );
}
