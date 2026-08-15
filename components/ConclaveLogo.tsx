"use client";

import { useId } from "react";

interface Props {
  /** Pixel size of the mark (width & height). */
  size?: number;
  className?: string;
  /** Show wordmark beside the seal. */
  withWordmark?: boolean;
  /** Larger seal + wordmark for hero/footer. */
  variant?: "nav" | "hero" | "mark";
}

/**
 * Crisp vector seal — never rasterized, sharp on retina.
 * Double ring + tick marks + monogram C.
 */
export default function ConclaveLogo({
  size = 36,
  className = "",
  withWordmark = false,
  variant = "nav",
}: Props) {
  const uid = useId().replace(/:/g, "");
  const rim = `conclave-rim-${uid}`;
  const face = `conclave-face-${uid}`;
  const sheen = `conclave-sheen-${uid}`;

  const mark = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-hidden={withWordmark ? true : undefined}
      role={withWordmark ? undefined : "img"}
      aria-label={withWordmark ? undefined : "Conclave"}
    >
      <defs>
        <linearGradient id={rim} x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="0.35" stopColor="#c8c8c8" stopOpacity="0.85" />
          <stop offset="0.65" stopColor="#7a7a7a" stopOpacity="0.75" />
          <stop offset="1" stopColor="#f0f0f0" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id={face} x1="32" y1="8" x2="32" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1a1a1a" />
          <stop offset="1" stopColor="#050505" />
        </linearGradient>
        <radialGradient
          id={sheen}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(22 18) rotate(55) scale(36)"
        >
          <stop stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="32" cy="32" r="30.5" fill={`url(#${face})`} stroke={`url(#${rim})`} strokeWidth="1.25" />

      {Array.from({ length: 48 }).map((_, i) => {
        const a = (i / 48) * Math.PI * 2 - Math.PI / 2;
        const long = i % 4 === 0;
        const r1 = long ? 26.2 : 27.1;
        const r2 = 28.6;
        return (
          <line
            key={i}
            x1={32 + Math.cos(a) * r1}
            y1={32 + Math.sin(a) * r1}
            x2={32 + Math.cos(a) * r2}
            y2={32 + Math.sin(a) * r2}
            stroke="#ffffff"
            strokeOpacity={long ? 0.55 : 0.22}
            strokeWidth={long ? 1 : 0.6}
            strokeLinecap="round"
          />
        );
      })}

      <circle cx="32" cy="32" r="22.5" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="0.75" />
      <circle cx="32" cy="32" r="20.25" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="0.5" />

      {[0, 90, 180, 270].map((deg) => {
        const a = ((deg - 90) * Math.PI) / 180;
        const x = 32 + Math.cos(a) * 24.4;
        const y = 32 + Math.sin(a) * 24.4;
        return (
          <rect
            key={deg}
            x={x - 1.1}
            y={y - 1.1}
            width="2.2"
            height="2.2"
            fill="#ffffff"
            fillOpacity="0.7"
            transform={`rotate(45 ${x} ${y})`}
          />
        );
      })}

      <path
        d="M42.2 24.2c-1.4-2.6-4.2-4.4-7.8-4.4-5.9 0-10.2 4.5-10.2 12.2s4.3 12.2 10.2 12.2c3.6 0 6.4-1.8 7.8-4.4"
        stroke="#f5f5f5"
        strokeWidth="2.35"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M41.3 25.1c-1.2-2.2-3.6-3.7-6.9-3.7-5.1 0-8.8 3.9-8.8 11.4s3.7 11.4 8.8 11.4c3.3 0 5.7-1.5 6.9-3.7"
        stroke="#ffffff"
        strokeOpacity="0.2"
        strokeWidth="0.7"
        strokeLinecap="round"
        fill="none"
      />

      <circle cx="32" cy="32" r="1.15" fill="#ffffff" fillOpacity="0.35" />
      <circle cx="32" cy="32" r="30" fill={`url(#${sheen})`} />
    </svg>
  );

  if (!withWordmark) {
    return <span className={`inline-flex ${className}`}>{mark}</span>;
  }

  const wordSize = variant === "hero" ? "text-[1.65rem] sm:text-3xl" : "text-2xl";

  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      {mark}
      <span
        className={`font-semibold tracking-tight text-ivory ${wordSize}`}
        style={{ textRendering: "geometricPrecision" }}
      >
        Con<span className="text-accent">clave</span>
      </span>
    </span>
  );
}
