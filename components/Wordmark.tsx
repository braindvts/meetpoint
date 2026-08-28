import Link from "next/link";

interface Props {
  href?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/** Text wordmark — no mark / seal. */
export default function Wordmark({ href = "/", size = "md", className = "" }: Props) {
  const scale =
    size === "lg"
      ? "text-[1.65rem] tracking-tight"
      : size === "sm"
        ? "text-[1.05rem] tracking-tight"
        : "text-[1.35rem] tracking-tight";
  const inner = (
    <span className={`font-display font-semibold tracking-tight text-ivory ${scale} ${className}`}>
      Con<span className="text-accent">clave</span>
    </span>
  );
  if (!href) return inner;
  return (
    <Link href={href} className="inline-flex items-baseline transition hover:opacity-90">
      {inner}
    </Link>
  );
}
