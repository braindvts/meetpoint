import { BLACK_LABEL } from "@/lib/black";

interface Props {
  size?: "xs" | "sm" | "md";
  className?: string;
}

/**
 * BLACK — the loudest standing. A void lockup with a filled node.
 * Not a metal chip, not a numbered plaque, not Amex chrome.
 */
export default function BlackBadge({ size = "sm", className = "" }: Props) {
  const scale =
    size === "md" ? "stand--md" : size === "xs" ? "stand--xs" : "";

  return (
    <span
      className={`stand stand--black ${scale} ${className}`}
      title="BLACK — premium verified member"
    >
      <span className="stand-node" aria-hidden />
      <span className="stand-word">{BLACK_LABEL}</span>
    </span>
  );
}
