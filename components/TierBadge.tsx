import { formatTierLabel, type MemberTier } from "@/lib/tiers";

interface Props {
  tier: MemberTier | null;
  size?: "sm" | "md";
}

/**
 * Signal lockup for Member / Verified / BLACK — node + word.
 * BLACK standing next to a name still uses BlackBadge (check).
 */
export const TIER_CARD: Record<
  MemberTier,
  { mark: string; label: string; row: string }
> = {
  1: {
    mark: "level-lockup level-lockup--member",
    label: "text-[#c5d0dc]",
    row: "border-[#6d7f96]/22 bg-[#7a8ba3]/[0.05]",
  },
  2: {
    mark: "level-lockup level-lockup--verified",
    label: "text-[#d4c4a8]",
    row: "border-[#d4c4a8]/22 bg-[#d4c4a8]/[0.05]",
  },
  3: {
    mark: "level-lockup level-lockup--black",
    label: "text-[#f5f5f5]",
    row: "border-accent/28 bg-black",
  },
};

export default function TierBadge({ tier, size = "sm" }: Props) {
  const resolved: MemberTier = tier ?? 1;
  const style = TIER_CARD[resolved];
  const pad =
    size === "md"
      ? "text-[11px] tracking-[0.22em]"
      : "text-[9.5px] tracking-[0.2em]";

  return (
    <span
      className={`relative inline-flex shrink-0 items-center ${style.mark} ${pad}`}
      title={formatTierLabel(resolved)}
    >
      <span className="level-lockup-node" aria-hidden />
      <span className="level-lockup-word">{formatTierLabel(resolved)}</span>
    </span>
  );
}
