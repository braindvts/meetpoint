import BlackBadge from "@/components/BlackBadge";
import { formatTierLabel, type MemberTier } from "@/lib/tiers";

interface Props {
  tier: MemberTier | null;
  size?: "sm" | "md";
}

/**
 * Shared metal-mark styling for Member / Verified.
 * BLACK uses BlackBadge — same family, blacked-out and louder.
 */
export const TIER_CARD: Record<
  MemberTier,
  { mark: string; label: string; row: string }
> = {
  1: {
    mark: "level-mark level-mark--member",
    label: "text-[#b8c4d4]",
    row: "border-[#6d7f96]/25 bg-[#7a8ba3]/[0.08]",
  },
  2: {
    mark: "level-mark level-mark--verified",
    label: "text-[#d4c4a8]",
    row: "border-[#d4c4a8]/25 bg-[#d4c4a8]/[0.07]",
  },
  3: {
    mark: "level-mark level-mark--black",
    label: "text-[#f5f5f5]",
    row: "border-white/15 bg-black relative overflow-hidden black-centurion",
  },
};

export default function TierBadge({ tier, size = "sm" }: Props) {
  const resolved: MemberTier = tier ?? 1;

  if (resolved === 3) {
    return <BlackBadge size={size === "md" ? "md" : "sm"} />;
  }

  const style = TIER_CARD[resolved];
  const pad =
    size === "md"
      ? "px-3.5 py-1.5 text-[11px] tracking-[0.22em]"
      : "px-2.5 py-1 text-[9.5px] tracking-[0.2em]";

  return (
    <span
      className={`relative inline-flex shrink-0 items-center font-semibold uppercase ${style.mark} ${pad}`}
      title={formatTierLabel(resolved)}
    >
      <span className="level-mark-sheen" aria-hidden />
      <span className="relative">{formatTierLabel(resolved)}</span>
    </span>
  );
}
