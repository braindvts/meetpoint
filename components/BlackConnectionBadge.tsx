import { blackConnectionLevel } from "@/lib/black";

interface Props {
  /** How many BLACK network connections the member holds. */
  count?: number;
  showCount?: boolean;
  className?: string;
}

/**
 * BLACK CONNECTION — just a black checkmark next to the name.
 * Hover/title still explains the credential.
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
      title={`BLACK CONNECTION — ${level.name || "connected"}${showCount ? ` (${count})` : ""}`}
      aria-label={`BLACK CONNECTION${showCount ? `, ${count}` : ""}`}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="10" fill="#000" stroke="#bdbdbd" strokeWidth="1.5" />
        <path
          d="M7.5 12.4l3 3 6-6.5"
          stroke="#f5f5f5"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showCount ? (
        <span className="text-[10px] font-semibold tabular-nums text-ivory/70">{count}</span>
      ) : null}
    </span>
  );
}
