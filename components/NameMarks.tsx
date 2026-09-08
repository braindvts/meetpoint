import BlackBadge from "@/components/BlackBadge";
import BlackConnectionBadge from "@/components/BlackConnectionBadge";

interface Props {
  /** BLACK standing — black check. */
  black?: boolean;
  /** Trusted (BLACK CONNECTION) — blue check. */
  trusted?: boolean;
  /** Connection count for tooltip / optional count on plans. */
  trustedCount?: number;
  size?: "xs" | "sm" | "md";
  className?: string;
}

/** Compact verification marks rendered beside a member’s name. */
export default function NameMarks({
  black = false,
  trusted = false,
  trustedCount,
  size = "xs",
  className = "",
}: Props) {
  if (!black && !trusted) return null;
  return (
    <span className={`inline-flex shrink-0 items-center gap-0.5 ${className}`}>
      {black ? <BlackBadge size={size} /> : null}
      {trusted ? (
        <BlackConnectionBadge count={trustedCount ?? 1} labeled={false} />
      ) : null}
    </span>
  );
}
