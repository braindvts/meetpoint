import { BLACK_LABEL } from "@/lib/black";

interface Props {
  size?: "xs" | "sm" | "md";
  className?: string;
}

/**
 * The BLACK mark — same metal-card family as Member / Verified, fully blacked
 * out with a living sheen. Deliberately the loudest badge in the app.
 */
export default function BlackBadge({ size = "sm", className = "" }: Props) {
  const pad =
    size === "md"
      ? "px-3.5 py-1.5 text-[11px] tracking-[0.3em]"
      : size === "xs"
        ? "px-2 py-[3px] text-[8.5px] tracking-[0.24em]"
        : "px-2.5 py-1 text-[9.5px] tracking-[0.26em]";

  return (
    <span
      className={`level-mark level-mark--black relative inline-flex shrink-0 items-center font-semibold uppercase text-[#f5f5f5] ${pad} ${className}`}
      title="BLACK — premium verified member"
    >
      <span className="level-mark-sheen level-mark-sheen--live" aria-hidden />
      <span className="relative z-[1]">{BLACK_LABEL}</span>
    </span>
  );
}
