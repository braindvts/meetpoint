import { BLACK_LABEL } from "@/lib/black";

interface Props {
  size?: "xs" | "sm" | "md";
  className?: string;
}

/**
 * The BLACK mark — a blacked-out metal card, not a rank chip. Deliberately the
 * loudest badge in the app, since it's the one members pay or work for.
 */
export default function BlackBadge({ size = "sm", className = "" }: Props) {
  const pad =
    size === "md"
      ? "px-3.5 py-1.5 text-[11px] tracking-[0.28em]"
      : size === "xs"
        ? "px-2 py-[3px] text-[8.5px] tracking-[0.22em]"
        : "px-2.5 py-1 text-[9.5px] tracking-[0.24em]";

  return (
    <span
      className={`black-mark relative inline-flex shrink-0 items-center font-semibold uppercase text-[#f5f5f5] ${pad} ${className}`}
      title="BLACK — premium verified member"
    >
      <span className="black-mark-sheen" aria-hidden />
      <span className="relative">{BLACK_LABEL}</span>
    </span>
  );
}
