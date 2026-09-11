"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { pickInterlinkLine } from "@/lib/lines";

const BRAND = "INTERLINK";
const LETTERS = BRAND.split("");
const SESSION_KEY = "interlink.splash.seen";
const LEGACY_SESSION_KEY = "conclave.splash.seen";
const LETTER_MS = 220;
const START_MS = 520;
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
      const noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.08), ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        // Fast decay white noise — reads as a hard “click”
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3.2);
      }
      splashAudio = { ctx, noise };
    }
    if (splashAudio.ctx.state === "suspended") void splashAudio.ctx.resume();
    return splashAudio;
  } catch {
    return null;
  }
}

/** Punchy mechanical click via Web Audio (shared context, no asset). */
function playClick(kind: "letter" | "final") {
  const audio = getSplashAudio();
  if (!audio) return;
  try {
    const { ctx, noise } = audio;
    const t0 = ctx.currentTime;

    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noise;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "highpass";
    const noiseGain = ctx.createGain();

    const tick = ctx.createOscillator();
    tick.type = "square";
    const tickFilter = ctx.createBiquadFilter();
    tickFilter.type = "bandpass";
    const tickGain = ctx.createGain();

    if (kind === "letter") {
      // Sharp typewriter tick — short, bright, unmistakable
      noiseFilter.frequency.value = 2200;
      noiseGain.gain.setValueAtTime(0.0001, t0);
      noiseGain.gain.exponentialRampToValueAtTime(0.42, t0 + 0.0015);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.038);

      tick.frequency.setValueAtTime(1950, t0);
      tick.frequency.exponentialRampToValueAtTime(420, t0 + 0.028);
      tickFilter.frequency.value = 2400;
      tickFilter.Q.value = 4.5;
      tickGain.gain.setValueAtTime(0.0001, t0);
      tickGain.gain.exponentialRampToValueAtTime(0.22, t0 + 0.001);
      tickGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.045);

      noiseSrc.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      tick.connect(tickFilter);
      tickFilter.connect(tickGain);
      tickGain.connect(ctx.destination);
      noiseSrc.start(t0);
      tick.start(t0);
      tick.stop(t0 + 0.05);
    } else {
      // Final seal: deep thud + double click (click-click)
      const thud = ctx.createOscillator();
      const thudGain = ctx.createGain();
      thud.type = "sine";
      thud.frequency.setValueAtTime(140, t0);
      thud.frequency.exponentialRampToValueAtTime(48, t0 + 0.22);
      thudGain.gain.setValueAtTime(0.0001, t0);
      thudGain.gain.exponentialRampToValueAtTime(0.38, t0 + 0.004);
      thudGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.28);

      noiseFilter.frequency.value = 900;
      noiseGain.gain.setValueAtTime(0.0001, t0);
      noiseGain.gain.exponentialRampToValueAtTime(0.55, t0 + 0.002);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.09);

      tick.frequency.setValueAtTime(1600, t0);
      tick.frequency.exponentialRampToValueAtTime(280, t0 + 0.05);
      tickFilter.frequency.value = 1800;
      tickFilter.Q.value = 2.8;
      tickGain.gain.setValueAtTime(0.0001, t0);
      tickGain.gain.exponentialRampToValueAtTime(0.28, t0 + 0.001);
      tickGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.07);

      // Second snap a beat later — the “click click!”
      const snap = ctx.createBufferSource();
      snap.buffer = noise;
      const snapFilter = ctx.createBiquadFilter();
      snapFilter.type = "highpass";
      snapFilter.frequency.value = 2800;
      const snapGain = ctx.createGain();
      const t1 = t0 + 0.085;
      snapGain.gain.setValueAtTime(0.0001, t1);
      snapGain.gain.exponentialRampToValueAtTime(0.48, t1 + 0.0015);
      snapGain.gain.exponentialRampToValueAtTime(0.0001, t1 + 0.05);

      const ping = ctx.createOscillator();
      const pingGain = ctx.createGain();
      ping.type = "triangle";
      ping.frequency.setValueAtTime(2400, t1);
      ping.frequency.exponentialRampToValueAtTime(700, t1 + 0.06);
      pingGain.gain.setValueAtTime(0.0001, t1);
      pingGain.gain.exponentialRampToValueAtTime(0.14, t1 + 0.002);
      pingGain.gain.exponentialRampToValueAtTime(0.0001, t1 + 0.08);

      thud.connect(thudGain);
      thudGain.connect(ctx.destination);
      noiseSrc.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      tick.connect(tickFilter);
      tickFilter.connect(tickGain);
      tickGain.connect(ctx.destination);
      snap.connect(snapFilter);
      snapFilter.connect(snapGain);
      snapGain.connect(ctx.destination);
      ping.connect(pingGain);
      pingGain.connect(ctx.destination);

      thud.start(t0);
      thud.stop(t0 + 0.3);
      noiseSrc.start(t0);
      tick.start(t0);
      tick.stop(t0 + 0.08);
      snap.start(t1);
      ping.start(t1);
      ping.stop(t1 + 0.09);
    }
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

    // Warm the audio graph early so the first click isn’t muted / delayed
    getSplashAudio();
    const unlockAudio = () => {
      getSplashAudio();
    };
    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });

    const timers: number[] = [];
    LETTERS.forEach((_, i) => {
      timers.push(
        window.setTimeout(() => {
          setShown(i + 1);
          playClick("letter");
        }, START_MS + i * LETTER_MS)
      );
    });

    const finaleAt = START_MS + LETTERS.length * LETTER_MS + 280;
    timers.push(
      window.setTimeout(() => {
        setFinale(true);
        setRipples((n) => n + 1);
        playClick("final");
      }, finaleAt)
    );
    timers.push(window.setTimeout(() => setRipples((n) => n + 1), finaleAt + 90));
    timers.push(window.setTimeout(() => setRipples((n) => n + 1), finaleAt + 200));
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
