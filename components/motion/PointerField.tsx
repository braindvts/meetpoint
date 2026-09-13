"use client";

import { useEffect } from "react";
import { usePrefersReducedMotion } from "@/components/motion/usePrefersReducedMotion";

/**
 * One pointer language for the whole site: CSS vars + a soft champagne orb.
 * Fine pointers only; disabled when the user prefers reduced motion.
 */
export default function PointerField() {
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const root = document.documentElement;
    let raf = 0;
    let tx = window.innerWidth / 2;
    let ty = 140;
    let cx = tx;
    let cy = ty;

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
    };

    const tick = () => {
      cx += (tx - cx) * 0.16;
      cy += (ty - cy) * 0.16;
      root.style.setProperty("--ptr-x", `${cx.toFixed(1)}px`);
      root.style.setProperty("--ptr-y", `${cy.toFixed(1)}px`);
      raf = window.requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    raf = window.requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.cancelAnimationFrame(raf);
    };
  }, [reduced]);

  if (reduced) return null;

  return <div className="il-pointer-orb" aria-hidden />;
}
