import BlackBadge from "@/components/BlackBadge";
import { formatTierLabel, type MemberTier } from "@/lib/tiers";

interface Props {
  tier: MemberTier | null;
  size?: "sm" | "md";
}

/**
 * Editorial standing — index + name, not metal chips.
 * Verified is the champagne word only; do not add a check here.
 * BLACK is its own plaque.
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

const INDEX: Record<1 | 2, string> = { 1: "01", 2: "02" };

export default function TierBadge({ tier, size = "sm" }: Props) {
  const resolved: MemberTier = tier ?? 1;

  if (resolved === 3) {
    return <BlackBadge size={size === "md" ? "md" : "sm"} />;
  }

  const scale = size === "md" ? "tier-mark--md" : "";

  return (
    <span
      className={`tier-mark ${resolved === 2 ? "tier-mark--verified" : "tier-mark--member"} ${scale}`}
      title={formatTierLabel(resolved)}
    >
      <span className="tier-mark-idx" aria-hidden>
        {INDEX[resolved]}
      </span>
      <span>{formatTierLabel(resolved)}</span>
    </span>
  );
}
