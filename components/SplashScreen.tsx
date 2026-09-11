"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { pickInterlinkLine } from "@/lib/lines";

const BRAND = "INTERLINK";
const LETTERS = BRAND.split("");
const SESSION_KEY = "interlink.splash.seen";
const LEGACY_SESSION_KEY = "conclave.splash.seen";
const LETTER_MS = 240;
const START_MS = 560;
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

type SplashAudio = {
  ctx: AudioContext;
  noise: AudioBuffer;
};

let splashAudio: SplashAudio | null = null;

function getSplashAudio(): SplashAudio | null {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    if (!splashAudio || splashAudio.ctx.state === "closed") {
      const ctx = new Ctx();
      // Ultra-short buffer for a hard edge
      const noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.025), ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const t = i / data.length;
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 8);
      }
      splashAudio = { ctx, noise };
    }
    if (splashAudio.ctx.state === "suspended") void splashAudio.ctx.resume();
    return splashAudio;
  } catch {
    return null;
  }
}

/** Razor-sharp mouse-button click (shared context). */
function playClick(kind: "letter" | "final") {
  const audio = getSplashAudio();
  if (!audio) return;
  try {
    const { ctx, noise } = audio;
    const t0 = ctx.currentTime;

    const fire = (at: number, gainPeak: number, hp: number) => {
      const src = ctx.createBufferSource();
      src.buffer = noise;
      const hpFilter = ctx.createBiquadFilter();
      hpFilter.type = "highpass";
      hpFilter.frequency.value = hp;
      hpFilter.Q.value = 0.7;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(gainPeak, at + 0.0006);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.018);

      const pop = ctx.createOscillator();
      pop.type = "square";
      pop.frequency.setValueAtTime(3200, at);
      pop.frequency.exponentialRampToValueAtTime(900, at + 0.012);
      const pg = ctx.createGain();
      pg.gain.setValueAtTime(0.0001, at);
      pg.gain.exponentialRampToValueAtTime(gainPeak * 0.55, at + 0.0005);
      pg.gain.exponentialRampToValueAtTime(0.0001, at + 0.014);

      src.connect(hpFilter);
      hpFilter.connect(g);
      g.connect(ctx.destination);
      pop.connect(pg);
      pg.connect(ctx.destination);
      src.start(at);
      pop.start(at);
      pop.stop(at + 0.016);
    };

    if (kind === "letter") {
      fire(t0, 0.72, 4500);
    } else {
      // Visible double-click: click … click
      fire(t0, 0.85, 3800);
      fire(t0 + 0.09, 0.95, 5200);
    }
  } catch {
    /* autoplay / unsupported */
  }
}

/** Classic arrow cursor that visibly presses. */
function ClickCursor({ pressing }: { pressing?: boolean }) {
  return (
    <span className={`mp-splash-cursor ${pressing ? "mp-splash-cursor--press" : ""}`} aria-hidden>
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none">
        <path
          d="M5.2 3.1 18.6 12.2l-5.5 1.3 2.9 6.7-2.4 1-2.9-6.6-4.4 4.1z"
          fill="#efe6d6"
          stroke="#050505"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
      <i className="mp-splash-cursor-ripple" />
    </span>
  );
}

/**
 * First-open loading seal — INTERLINK types with a visible cursor click
 * on each letter, then a final double-click. (?splash=1 to replay)
 */
export default function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [shown, setShown] = useState(0);
  const [clickAt, setClickAt] = useState<number | null>(null);
  const [finale, setFinale] = useState(false);
  const [finalePress, setFinalePress] = useState(false);
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

    getSplashAudio();
    const unlockAudio = () => {
      getSplashAudio();
    };
    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });

    const timers: number[] = [];
    LETTERS.forEach((_, i) => {
      const t = START_MS + i * LETTER_MS;
      // Cursor appears slightly before the strike
      timers.push(
        window.setTimeout(() => {
          setClickAt(i);
        }, t - 70)
      );
      timers.push(
        window.setTimeout(() => {
          setShown(i + 1);
          setClickAt(i);
          playClick("letter");
        }, t)
      );
      timers.push(
        window.setTimeout(() => {
          setClickAt((cur) => (cur === i ? null : cur));
        }, t + 140)
      );
    });

    const finaleAt = START_MS + LETTERS.length * LETTER_MS + 320;
    timers.push(
      window.setTimeout(() => {
        setClickAt(null);
        setFinale(true);
        setFinalePress(true);
        setRipples((n) => n + 1);
        playClick("final");
      }, finaleAt)
    );
    timers.push(window.setTimeout(() => setRipples((n) => n + 1), finaleAt + 90));
    timers.push(window.setTimeout(() => setFinalePress(false), finaleAt + 280));
    timers.push(window.setTimeout(() => setLeaving(true), finaleAt + FINAL_HOLD_MS));
    timers.push(window.setTimeout(finish, finaleAt + FINAL_HOLD_MS + 900));
    timers.push(window.setTimeout(finish, 14000));

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      if (hideTimer) window.clearTimeout(hideTimer);
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
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
          <div
            key={ripples}
            className="mp-splash-click-burst absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2"
          >
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
          }`}
        >
          {LETTERS.map((ch, i) => (
            <span
              key={`${ch}-${i}`}
              className={`mp-splash-letter ${i < shown ? "mp-splash-letter--in" : ""} ${
                clickAt === i ? "mp-splash-letter--hit" : ""
              }`}
              aria-hidden={i >= shown}
            >
              {ch}
              {clickAt === i ? <ClickCursor pressing /> : null}
              {i < shown ? <i className="mp-splash-letter-spark" aria-hidden /> : null}
              {clickAt === i ? <i className="mp-splash-hit-ring" aria-hidden /> : null}
            </span>
          ))}
          {finale ? (
            <span className="mp-splash-finale-cursor">
              <ClickCursor pressing={finalePress} />
            </span>
          ) : null}
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
              transition: "width 280ms cubic-bezier(0.22, 1, 0.36, 1)",
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
