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
 * BLACK CONNECTION — a credential, not a tier. Outlined rather than filled so
 * it reads as secondary to the BLACK mark at a glance.
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
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border border-accent/45 bg-accent/[0.06] px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.18em] text-accent ${className}`}
      title={`BLACK CONNECTION — ${level.name || "connected"} (${count})`}
    >
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9.5 14.5l5-5" strokeLinecap="round" />
        <path d="M7.8 11.2 6.4 12.6a3 3 0 0 0 4.2 4.2l1.4-1.4" strokeLinecap="round" />
        <path d="M16.2 12.8l1.4-1.4a3 3 0 0 0-4.2-4.2l-1.4 1.4" strokeLinecap="round" />
      </svg>
      {variant === "compact" ? "BLACK CONN." : "BLACK CONNECTION"}
      {showCount ? <span className="text-accent-2">· {count}</span> : null}
    </span>
  );
}
