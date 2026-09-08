import { blackConnectionLevel } from "@/lib/black";

interface Props {
  /** How many BLACK network connections the member holds. */
  count?: number;
  /** Compact mark for dense rows; full shows the wording. */
  variant?: "compact" | "full";
  showCount?: boolean;
  className?: string;
}

/**
 * BLACK CONNECTION — a credential, not a level.
 * Marked with a black check so it reads clearly next to the BLACK badge.
 */
export default function BlackConnectionBadge({
  count = 1,
  variant = "full",
  showCount = false,
  className = "",
}: Props) {
  if (count < 1) return null;
  const level = blackConnectionLevel(count);

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/25 bg-black px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-[#f5f5f5] shadow-[0_0_0_1px_#000] ${className}`}
      title={`BLACK CONNECTION — ${level.name || "connected"} (${count})`}
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="10" fill="#0a0a0a" stroke="#cfcfcf" strokeWidth="1.4" />
        <path
          d="M7.5 12.4l3 3 6-6.5"
          stroke="#f5f5f5"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {variant === "compact" ? "CONN." : "CONNECTION"}
      {showCount ? <span className="text-white/70">· {count}</span> : null}
    </span>
  );
}
