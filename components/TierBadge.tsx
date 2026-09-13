import BlackBadge from "@/components/BlackBadge";
import { formatTierLabel, type MemberTier } from "@/lib/tiers";

interface Props {
  tier: MemberTier | null;
  size?: "sm" | "md";
}

/**
 * Editorial standing marks — a hairline rule + the name.
 * Not metal chips. BLACK is its own plaque.
 */
export const TIER_CARD: Record<
  MemberTier,
  { mark: string; label: string; row: string }
> = {
  1: {
    mark: "tier-mark tier-mark--member",
    label: "text-[#c5cdd8]",
    row: "border-white/10 bg-transparent",
  },
  2: {
    mark: "tier-mark tier-mark--verified",
    label: "text-accent",
    row: "border-accent/20 bg-transparent",
  },
  3: {
    mark: "tier-mark tier-mark--black",
    label: "text-[#f5f5f5]",
    row: "border-white/15 bg-black",
  },
};

export default function TierBadge({ tier, size = "sm" }: Props) {
  const resolved: MemberTier = tier ?? 1;

  if (resolved === 3) {
    return <BlackBadge size={size === "md" ? "md" : "sm"} />;
  }

  const pad = size === "md" ? "text-[11px] tracking-[0.2em]" : "text-[10px] tracking-[0.18em]";

  return (
    <span
      className={`tier-mark ${resolved === 2 ? "tier-mark--verified" : "tier-mark--member"} ${pad}`}
      title={formatTierLabel(resolved)}
    >
      <span className="tier-mark-bar" aria-hidden />
      <span>{formatTierLabel(resolved)}</span>
    </span>
  );
}
