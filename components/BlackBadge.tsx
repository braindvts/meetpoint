import { BLACK_LABEL } from "@/lib/black";

interface Props {
  size?: "xs" | "sm" | "md";
  className?: string;
}

/**
 * BLACK — the loudest standing. A tight black plaque, not a metal chip.
 */
export default function BlackBadge({ size = "sm", className = "" }: Props) {
  const pad =
    size === "md"
      ? "px-2.5 py-1 text-[11px] tracking-[0.28em]"
      : size === "xs"
        ? "px-1.5 py-[2px] text-[8.5px] tracking-[0.24em]"
        : "px-2 py-[3px] text-[10px] tracking-[0.26em]";

  return (
    <span
      className={`tier-mark tier-mark--black ${pad} ${className}`}
      title="BLACK — premium standing"
    >
      {BLACK_LABEL}
    </span>
  );
}
