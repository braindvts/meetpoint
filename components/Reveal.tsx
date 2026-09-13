"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  /** Extra delay after the element enters, in ms. */
  delay?: number;
  /** Draw the champagne rule as it enters. */
  line?: boolean;
}

/**
 * Scroll-linked reveal — one observer, one easing, no library.
 * Respects prefers-reduced-motion.
 */
export default function Reveal({ children, className = "", delay = 0, line = false }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOn(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setOn(true);
        io.disconnect();
      },
      { threshold: 0.18, rootMargin: "0px 0px -6% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const style = delay ? ({ "--mp-delay": `${delay}ms` } as CSSProperties) : undefined;

  return (
    <div
      ref={ref}
      className={`mp-inview ${line ? "mp-inview--line" : ""} ${on ? "is-in" : ""} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
