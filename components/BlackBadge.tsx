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
 * BLACK standing mark — sharp black square with check (not a circular bubble).
 */
export default function BlackBadge({ size = "sm", className = "" }: Props) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
      title="BLACK"
      aria-label="BLACK"
    >
      <svg viewBox="0 0 24 24" className={SIZE[size]} aria-hidden>
        <rect
          x="1.5"
          y="1.5"
          width="21"
          height="21"
          rx="2"
          fill="#050505"
          stroke="#c4b496"
          strokeWidth="1.25"
        />
        <path
          d="M7.2 12.3l3.1 3.1 6.5-6.8"
          fill="none"
          stroke="#ece8e0"
          strokeWidth="2.2"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
      </svg>
    </span>
  );
}
