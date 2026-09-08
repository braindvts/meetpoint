import { blackConnectionLevel } from "@/lib/black";

interface Props {
  /** How many BLACK network connections the member holds. */
  count?: number;
  showCount?: boolean;
  className?: string;
  /**
   * Labeled mark: checkmark + “Trusted by BLACK”.
   * Keep this away from the BLACK level badge so the two aren’t confused.
   */
  labeled?: boolean;
}

/**
 * BLACK CONNECTION — separate from BLACK standing.
 * Prefer the labeled form so it doesn’t look like part of the BLACK badge.
 */
export default function BlackConnectionBadge({
  count = 1,
  showCount = false,
  className = "",
  labeled = true,
}: Props) {
  if (count < 1) return null;
  const level = blackConnectionLevel(count);

  const mark = (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="#000" stroke="#bdbdbd" strokeWidth="1.5" />
      <path
        d="M7.5 12.4l3 3 6-6.5"
        stroke="#f5f5f5"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (labeled) {
    return (
      <span
        className={`inline-flex shrink-0 items-center gap-1.5 text-[10px] font-medium tracking-wide text-ivory/70 ${className}`}
        title={`BLACK CONNECTION — ${level.name || "connected"}${showCount ? ` (${count})` : ""}`}
        aria-label={`Trusted by BLACK${showCount ? `, ${count}` : ""}`}
      >
        {mark}
        <span>Trusted by BLACK</span>
        {showCount ? (
          <span className="tabular-nums text-ivory/50">· {count}</span>
        ) : null}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 ${className}`}
      title={`BLACK CONNECTION — ${level.name || "connected"}${showCount ? ` (${count})` : ""}`}
      aria-label={`BLACK CONNECTION${showCount ? `, ${count}` : ""}`}
    >
      {mark}
      {showCount ? (
        <span className="text-[10px] font-semibold tabular-nums text-ivory/70">{count}</span>
      ) : null}
    </span>
  );
}
