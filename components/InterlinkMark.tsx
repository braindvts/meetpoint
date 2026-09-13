interface Props {
  size?: number;
  className?: string;
}

/** Two nodes, one link — the Interlink mark. Not a seal, not a monogram C. */
export default function InterlinkMark({ size = 28, className = "" }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={`shrink-0 ${className}`}
      aria-hidden
    >
      <circle cx="8.5" cy="16" r="3.2" stroke="#d4c4a8" strokeWidth="1.6" />
      <circle cx="23.5" cy="16" r="3.2" fill="#d4c4a8" />
      <path
        d="M12 16h8"
        stroke="#d4c4a8"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
