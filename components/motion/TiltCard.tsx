"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { usePrefersReducedMotion } from "@/components/motion/usePrefersReducedMotion";

interface Props {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
}

/** Desktop: the card faces the pointer. Touch / reduced motion: static. */
export default function TiltCard({ children, className = "", maxTilt = 6 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduced || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--tilt-x", `${(-py * maxTilt).toFixed(2)}deg`);
    el.style.setProperty("--tilt-y", `${(px * maxTilt).toFixed(2)}deg`);
    el.style.setProperty("--spot-x", `${((px + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty("--spot-y", `${((py + 0.5) * 100).toFixed(1)}%`);
  }

  function onLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--tilt-x", "0deg");
    el.style.setProperty("--tilt-y", "0deg");
  }

  const style = {
    "--tilt-x": "0deg",
    "--tilt-y": "0deg",
    "--spot-x": "50%",
    "--spot-y": "20%",
  } as CSSProperties;

  return (
    <div
      ref={ref}
      className={`il-tilt ${className}`}
      style={style}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      {children}
    </div>
  );
}
