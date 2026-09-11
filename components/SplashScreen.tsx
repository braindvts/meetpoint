"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { pickInterlinkLine } from "@/lib/lines";

const BRAND = "INTERLINK";
const LETTERS = BRAND.split("");
const SESSION_KEY = "interlink.splash.seen";
const LEGACY_SESSION_KEY = "conclave.splash.seen";
const LETTER_MS = 165;
const FINAL_HOLD_MS = 1100;

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

/** Soft mechanical click via Web Audio (no asset download). */
function playClick(kind: "letter" | "final") {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = "square";
    filter.type = "bandpass";
    if (kind === "letter") {
      osc.frequency.setValueAtTime(920, t0);
      osc.frequency.exponentialRampToValueAtTime(240, t0 + 0.045);
      filter.frequency.value = 1800;
      filter.Q.value = 2.2;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.085, t0 + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.06);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.07);
    } else {
      // Deeper “seal” click + brief shimmer
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc.frequency.setValueAtTime(180, t0);
      osc.frequency.exponentialRampToValueAtTime(55, t0 + 0.14);
      filter.frequency.value = 420;
      filter.Q.value = 1.1;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.16, t0 + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1400, t0);
      osc2.frequency.exponentialRampToValueAtTime(600, t0 + 0.12);
      gain2.gain.setValueAtTime(0.0001, t0);
      gain2.gain.exponentialRampToValueAtTime(0.05, t0 + 0.01);
      gain2.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.2);
      osc2.start(t0);
      osc2.stop(t0 + 0.18);
    }
    window.setTimeout(() => void ctx.close(), 400);
  } catch {
    /* autoplay / unsupported — visual still runs */
  }
}

/**
 * First-open loading seal — INTERLINK types letter by letter with a click,
 * then a final seal-click. Once per browser tab (?splash=1 to replay).
 */
export default function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [shown, setShown] = useState(0);
  const [finale, setFinale] = useState(false);
  const [ripples, setRipples] = useState(0);
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
      }, 700);
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
          playClick("letter");
        }, 420 + i * LETTER_MS)
      );
    });

    const finaleAt = 420 + LETTERS.length * LETTER_MS + 120;
    timers.push(
      window.setTimeout(() => {
        setFinale(true);
        setRipples((n) => n + 1);
        playClick("final");
      }, finaleAt)
    );
    timers.push(window.setTimeout(() => setRipples((n) => n + 1), finaleAt + 160));
    timers.push(window.setTimeout(() => setLeaving(true), finaleAt + FINAL_HOLD_MS));
    timers.push(window.setTimeout(finish, finaleAt + FINAL_HOLD_MS + 650));
    timers.push(window.setTimeout(finish, 9000));

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
      } ${finale ? "mp-splash-finale" : ""}`}
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
        {ripples > 0 ? (
          <div key={ripples} className="mp-splash-click-burst absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2">
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
          className={`mp-splash-type font-display text-[clamp(2.1rem,9vw,4.75rem)] font-semibold leading-[0.92] tracking-[0.14em] text-accent ${
            finale ? "mp-splash-type--locked" : ""
          }`}
        >
          {LETTERS.map((ch, i) => (
            <span
              key={`${ch}-${i}`}
              className={`mp-splash-letter ${i < shown ? "mp-splash-letter--in" : ""}`}
              aria-hidden={i >= shown}
            >
              {ch}
              {i < shown ? <i className="mp-splash-letter-spark" aria-hidden /> : null}
            </span>
          ))}
          <span className="sr-only">{BRAND}</span>
        </h1>

        {finale ? <span className="mp-splash-seal-flash" aria-hidden /> : null}

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
              transition: "width 160ms cubic-bezier(0.22, 1, 0.36, 1)",
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
