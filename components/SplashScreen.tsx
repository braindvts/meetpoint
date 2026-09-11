"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { pickInterlinkLine } from "@/lib/lines";

const BRAND = "INTERLINK";
const LETTERS = BRAND.split("");
const SESSION_KEY = "interlink.splash.seen";
const LEGACY_SESSION_KEY = "conclave.splash.seen";
const LETTER_MS = 200;
const START_MS = 480;
const FINAL_HOLD_MS = 2200;

function alreadySeen(): boolean {
  try {
    return (
      sessionStorage.getItem(SESSION_KEY) === "1" ||
      sessionStorage.getItem(LEGACY_SESSION_KEY) === "1"
    );
  } catch {
    return true;
  }
}

function markSeen() {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
    sessionStorage.setItem(LEGACY_SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
  document.documentElement.classList.remove("mp-boot-splash");
}

/**
 * First-open loading seal — INTERLINK appears letter by letter,
 * then a sharp visual snap at the end. No sound. (?splash=1 to replay)
 */
export default function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [shown, setShown] = useState(0);
  const [finale, setFinale] = useState(false);
  const [snap, setSnap] = useState(false);
  const finished = useRef(false);
  const line = useMemo(() => pickInterlinkLine(), []);

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
      }, 900);
    };

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShown(LETTERS.length);
      setFinale(true);
      finish();
      return () => {
        if (hideTimer) window.clearTimeout(hideTimer);
      };
    }

    const timers: number[] = [];
    LETTERS.forEach((_, i) => {
      timers.push(
        window.setTimeout(() => {
          setShown(i + 1);
        }, START_MS + i * LETTER_MS)
      );
    });

    const finaleAt = START_MS + LETTERS.length * LETTER_MS + 360;
    timers.push(
      window.setTimeout(() => {
        setFinale(true);
        setSnap(true);
      }, finaleAt)
    );
    timers.push(window.setTimeout(() => setSnap(false), finaleAt + 420));
    timers.push(window.setTimeout(() => setLeaving(true), finaleAt + FINAL_HOLD_MS));
    timers.push(window.setTimeout(finish, finaleAt + FINAL_HOLD_MS + 900));
    timers.push(window.setTimeout(finish, 14000));

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      if (hideTimer) window.clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`mp-splash fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden bg-ink ${
        leaving ? "mp-splash-out" : ""
      } ${finale ? "mp-splash-finale" : ""} ${snap ? "mp-splash-snap" : ""}`}
      role="status"
      aria-live="polite"
      aria-label="Loading Interlink"
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
        {snap ? (
          <div className="mp-splash-click-burst absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2">
            <span />
            <span />
            <span />
          </div>
        ) : null}
      </div>

      <div className="mp-splash-seal relative flex flex-col items-center px-6 text-center sm:px-8">
        <span className="mp-splash-ring" aria-hidden />
        <span className="mp-splash-ring mp-splash-ring--outer" aria-hidden />

        <p className="mp-splash-mark text-[10px] font-semibold uppercase tracking-[0.48em] text-accent/75">
          Private network
        </p>

        <div className="mp-splash-rule my-5 h-10 w-px bg-gradient-to-b from-transparent via-accent to-transparent" />

        <h1
          className={`mp-splash-type relative font-display text-[clamp(2.1rem,9vw,4.75rem)] font-semibold leading-[0.92] tracking-[0.14em] text-accent ${
            finale ? "mp-splash-type--locked" : ""
          } ${snap ? "mp-splash-type--snap" : ""}`}
        >
          {LETTERS.map((ch, i) => (
            <span
              key={`${ch}-${i}`}
              className={`mp-splash-letter ${i < shown ? "mp-splash-letter--in" : ""}`}
              style={i < shown ? { animationDelay: "0ms" } : undefined}
              aria-hidden={i >= shown}
            >
              {ch}
            </span>
          ))}
          <span className="sr-only">{BRAND}</span>
        </h1>

        {snap ? <span className="mp-splash-seal-flash" aria-hidden /> : null}
        {snap ? <span className="mp-splash-snap-ring" aria-hidden /> : null}

        <span
          className={`mp-splash-line mt-8 h-px w-32 origin-center bg-gradient-to-r from-transparent via-accent/90 to-transparent ${
            finale ? "mp-splash-line--show" : "opacity-0"
          }`}
        />

        <p
          className={`mp-splash-tag mt-7 max-w-[19rem] text-[15px] leading-relaxed text-ivory/72 sm:max-w-md sm:text-base ${
            finale ? "mp-splash-tag--show" : "opacity-0"
          }`}
        >
          {line}
        </p>

        <div className="mp-splash-bar mt-12 h-[2px] w-44 overflow-hidden rounded-full bg-white/[0.08] sm:w-52">
          <span
            className="mp-splash-bar-fill block h-full rounded-full bg-gradient-to-r from-accent/30 via-accent-2 to-accent/30"
            style={{
              width: `${Math.min(100, (shown / LETTERS.length) * 100)}%`,
              transition: "width 320ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
        </div>
        <p className="mp-splash-caption mt-5 text-[10px] font-semibold uppercase tracking-[0.32em] text-muted">
          {finale ? "Connected" : "Linking in"}
        </p>
      </div>
    </div>
  );
}
