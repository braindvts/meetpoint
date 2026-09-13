"use client";

import { useEffect } from "react";

/**
 * Pointer language — a quiet champagne spotlight and local CTA spots.
 * Fine pointers only; disabled for touch and reduced motion.
 */
export default function InteractionLayer() {
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || reduce.matches) return;

    const root = document.documentElement;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        root.style.setProperty("--mx", `${e.clientX}px`);
        root.style.setProperty("--my", `${e.clientY}px`);
        const spot = (e.target as HTMLElement | null)?.closest<HTMLElement>(".mp-spot");
        if (!spot) return;
        const r = spot.getBoundingClientRect();
        spot.style.setProperty("--spot-x", `${e.clientX - r.left}px`);
        spot.style.setProperty("--spot-y", `${e.clientY - r.top}px`);
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
      root.style.removeProperty("--mx");
      root.style.removeProperty("--my");
    };
  }, []);

  return <div className="mp-pointer-glow" aria-hidden />;
}
