"use client";

import { useEffect, useRef, useState } from "react";
import FeaturedPartners from "@/components/FeaturedPartners";

const BRAND = "INTERLINK";
const LETTERS = BRAND.split("");
const SESSION_KEY = "interlink.splash.seen";
const LEGACY_SESSION_KEY = "conclave.splash.seen";
const LETTER_MS = 170;
const START_MS = 360;
const FINAL_HOLD_MS = 2200;
/** Partner credit enters while the wordmark is still setting — no extra hold. */
const PARTNERS_AT = START_MS + 4 * LETTER_MS;

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
 * Minimal loader — one champagne mark, a wordmark type-in, open partner credit.
 * No sound. Replay with ?splash=1. Click anywhere to skip.
 */
export default function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [shown, setShown] = useState(0);
  const [finale, setFinale] = useState(false);
  const [partners, setPartners] = useState(false);
  const finished = useRef(false);

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
      }, 640);
    };

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShown(LETTERS.length);
      setFinale(true);
      setPartners(true);
      const hold = window.setTimeout(finish, 900);
      return () => {
        window.clearTimeout(hold);
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

    const finaleAt = START_MS + LETTERS.length * LETTER_MS + 180;
    timers.push(window.setTimeout(() => setPartners(true), PARTNERS_AT));
    timers.push(window.setTimeout(() => setFinale(true), finaleAt));
    timers.push(window.setTimeout(finish, finaleAt + FINAL_HOLD_MS));
    timers.push(window.setTimeout(finish, 12000));

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
      }`}
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
        }, 280);
      }}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,196,168,0.075),transparent_56%)]" />
      </div>

      <div className="mp-splash-seal relative flex flex-col items-center px-6 text-center">
        <svg className="mp-splash-geom" viewBox="0 0 80 80" aria-hidden>
          <polygon
            className="mp-splash-diamond"
            pathLength="1"
            points="40,7 73,40 40,73 7,40"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.7"
          />
          <polygon
            className="mp-splash-diamond mp-splash-diamond--inner"
            pathLength="1"
            points="40,24 56,40 40,56 24,40"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.45"
          />
        </svg>

        <h1 className="mp-splash-type relative mt-8 font-display text-[clamp(1.65rem,6.4vw,3.15rem)] font-medium leading-none tracking-[0.28em] text-accent">
          {LETTERS.map((ch, i) => (
            <span
              key={`${ch}-${i}`}
              className={`mp-splash-letter ${i < shown ? "mp-splash-letter--in" : ""}`}
              aria-hidden={i >= shown}
            >
              {ch}
            </span>
          ))}
          <span className="sr-only">{BRAND}</span>
        </h1>

        <span
          className={`mp-splash-line mt-6 ${finale ? "mp-splash-line--show" : ""}`}
          aria-hidden
        />
      </div>

      <FeaturedPartners revealed={partners} />
    </div>
  );
}
