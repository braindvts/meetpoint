import BlackBadge from "@/components/BlackBadge";
import { formatTierLabel, type MemberTier } from "@/lib/tiers";

interface Props {
  tier: MemberTier | null;
  size?: "sm" | "md";
}

/**
 * Standing lockups — a signal node + word.
 * Not metal chips, not numbered 01/02, not a matching plaque family.
 */
export const TIER_CARD: Record<
  MemberTier,
  { mark: string; label: string; row: string }
> = {
  1: {
    mark: "stand stand--member",
    label: "text-steel",
    row: "border-steel/20 bg-steel/[0.05]",
  },
  2: {
    mark: "stand stand--verified",
    label: "text-accent",
    row: "border-accent/20 bg-accent/[0.05]",
  },
  3: {
    mark: "stand stand--black",
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
  const scale = size === "md" ? "stand--md" : "";

  return (
    <span className={`${style.mark} ${scale}`} title={formatTierLabel(resolved)}>
      <span className="stand-node" aria-hidden />
      <span className="stand-word">{formatTierLabel(resolved)}</span>
    </span>
  );
}
