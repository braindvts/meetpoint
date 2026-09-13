import Link from "next/link";
import InterlinkMark from "@/components/InterlinkMark";
import { BRAND } from "@/lib/brand";

interface Props {
  href?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  mark?: boolean;
}

/** Interlink wordmark — Syne + optional two-node mark. */
export default function Wordmark({
  href = "/",
  size = "md",
  className = "",
  mark = true,
}: Props) {
  const scale =
    size === "lg"
      ? "text-[1.85rem] tracking-[-0.03em]"
      : size === "sm"
        ? "text-[1.05rem] tracking-[-0.02em]"
        : "text-[1.28rem] tracking-[-0.025em]";
  const markSize = size === "lg" ? 30 : size === "sm" ? 20 : 24;
  const inner = (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {mark ? <InterlinkMark size={markSize} /> : null}
      <span className={`font-display font-semibold text-ivory ${scale}`}>{BRAND}</span>
    </span>
  );
  if (!href) return inner;
  return (
    <Link href={href} className="il-press inline-flex items-baseline">
      {inner}
    </Link>
  );
}
