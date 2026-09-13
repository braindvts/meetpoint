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
        const el = (e.target as HTMLElement | null)?.closest<HTMLElement>(
          ".mp-spot, .mp-btn-lux"
        );
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--spot-x", `${e.clientX - r.left}px`);
        el.style.setProperty("--spot-y", `${e.clientY - r.top}px`);
        if (el.classList.contains("mp-btn-lux")) {
          const dx = ((e.clientX - (r.left + r.width / 2)) / r.width) * 8;
          const dy = ((e.clientY - (r.top + r.height / 2)) / r.height) * 6;
          el.style.setProperty("--pull-x", `${Math.max(-4, Math.min(4, dx))}px`);
          el.style.setProperty("--pull-y", `${Math.max(-3, Math.min(3, dy))}px`);
        }
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
