interface Props {
  size?: "xs" | "sm" | "md";
  className?: string;
}

const SIZE = {
  xs: "h-3.5 w-3.5",
  sm: "h-4 w-4",
  md: "h-5 w-5",
} as const;

/**
 * BLACK standing mark — solid black verification check (not a “BLACK” word badge).
 */
export default function BlackBadge({ size = "sm", className = "" }: Props) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
      title="BLACK"
      aria-label="BLACK"
    >
      <svg viewBox="0 0 24 24" className={SIZE[size]} aria-hidden>
        <circle cx="12" cy="12" r="11" fill="#0a0a0a" stroke="#3a3a3a" strokeWidth="1" />
        <path
          d="M7.2 12.3l3.1 3.1 6.5-6.8"
          fill="none"
          stroke="#f5f5f5"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
