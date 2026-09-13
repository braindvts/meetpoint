import { BLACK_LABEL } from "@/lib/black";

interface Props {
  size?: "xs" | "sm" | "md";
  className?: string;
}

/**
 * BLACK — the loudest standing. A letterpress plaque, not a metal chip.
 */
export default function BlackBadge({ size = "sm", className = "" }: Props) {
  const pad =
    size === "md"
      ? "tier-mark--md"
      : size === "xs"
        ? "tier-mark--xs"
        : "";

  return (
    <span
      className={`tier-mark tier-mark--black ${pad} ${className}`}
      title="BLACK — premium standing"
    >
      {BLACK_LABEL}
    </span>
  );
}
