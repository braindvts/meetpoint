import BlackBadge from "@/components/BlackBadge";
import { formatTierLabel, type MemberTier } from "@/lib/tiers";

interface Props {
  tier: MemberTier | null;
  size?: "sm" | "md";
}

/**
 * Standing lockups — typeset, not metal chips and not signal nodes.
 * BLACK stays the existing black check SVG (do not restyle it).
 */
export const TIER_CARD: Record<
  MemberTier,
  { mark: string; label: string; row: string }
> = {
  1: {
    mark: "mp-level mp-level--member",
    label: "text-steel",
    row: "border-white/10 bg-transparent",
  },
  2: {
    mark: "mp-level mp-level--verified",
    label: "text-accent",
    row: "border-accent/20 bg-transparent",
  },
  3: {
    mark: "mp-level mp-level--black",
    label: "text-ivory",
    row: "border-white/12 bg-black",
  },
};

export default function TierBadge({ tier, size = "sm" }: Props) {
  const resolved: MemberTier = tier ?? 1;

  if (resolved === 3) {
    return <BlackBadge size={size === "md" ? "md" : "sm"} />;
  }

  const style = TIER_CARD[resolved];
  const scale = size === "md" ? "mp-level--md" : "";

  return (
    <span
      className={`${style.mark} ${scale}`}
      title={formatTierLabel(resolved)}
    >
      {resolved === 2 ? <VerifiedCheck /> : null}
      {formatTierLabel(resolved)}
    </span>
  );
}

function VerifiedCheck() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
      <circle cx="12" cy="12" r="9.25" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M7.4 12.4l3 3 6.2-6.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
