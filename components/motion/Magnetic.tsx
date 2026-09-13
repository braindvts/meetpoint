"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { usePrefersReducedMotion } from "@/components/motion/usePrefersReducedMotion";

interface Props {
  children: ReactNode;
  className?: string;
  strength?: number;
}

/** Pulls a control slightly toward the cursor — press still scales via CSS. */
export default function Magnetic({ children, className = "", strength = 0.28 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduced || !window.matchMedia("(pointer: fine)").matches) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) * strength;
    const y = (e.clientY - r.top - r.height / 2) * strength;
    el.style.setProperty("--mag-x", `${x.toFixed(1)}px`);
    el.style.setProperty("--mag-y", `${y.toFixed(1)}px`);
  }

  function onLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--mag-x", "0px");
    el.style.setProperty("--mag-y", "0px");
  }

  const style = {
    "--mag-x": "0px",
    "--mag-y": "0px",
  } as CSSProperties;

  return (
    <div
      ref={ref}
      className={`il-magnetic ${className}`}
      style={style}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      {children}
    </div>
  );
}
