import { blackConnectionLevel } from "@/lib/black";

interface Props {
  /** How many BLACK network connections the member holds. */
  count?: number;
  showCount?: boolean;
  className?: string;
  /**
   * @deprecated Label removed — trusted members use a blue check by the name.
   * Kept so older call sites still compile; label is ignored.
   */
  labeled?: boolean;
}

const MARK = (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" aria-hidden>
    <rect x="1.5" y="1.5" width="21" height="21" rx="2" fill="#1e3a8a" stroke="#93c5fd" strokeWidth="1.25" />
    <path
      d="M7.2 12.3l3.1 3.1 6.5-6.8"
      stroke="#ffffff"
      strokeWidth="2.2"
      strokeLinecap="square"
      strokeLinejoin="miter"
    />
  </svg>
);

/**
 * Trusted member mark — blue verification check (BLACK CONNECTION).
 * Separate from BLACK standing (black check).
 */
export default function BlackConnectionBadge({
  count = 1,
  showCount = false,
  className = "",
}: Props) {
  if (count < 1) return null;
  const level = blackConnectionLevel(count);

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 ${className}`}
      title={`Trusted · ${level.name || "BLACK CONNECTION"}${showCount ? ` (${count})` : ""}`}
      aria-label={`Trusted member${showCount ? `, ${count}` : ""}`}
    >
      {MARK}
      {showCount ? (
        <span className="text-[10px] font-semibold tabular-nums text-ivory/70">{count}</span>
      ) : null}
    </span>
  );
}
