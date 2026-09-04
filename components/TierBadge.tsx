import BlackBadge from "@/components/BlackBadge";
import { formatTierLabel, type MemberTier } from "@/lib/tiers";

interface Props {
  tier: MemberTier | null;
  size?: "sm" | "md";
}

/** Metal / Centurion card palette — Elite is fully blacked out like a black Amex. */
export const TIER_CARD: Record<
  MemberTier,
  { badge: string; label: string; sheen?: string }
> = {
  1: {
    badge:
      "border-[#9aa3ad]/60 bg-gradient-to-br from-[#e8edf2] via-[#b8c0c8] to-[#8e98a3] text-[#1a1d21] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]",
    label: "text-[#c5ccd4]",
  },
  2: {
    badge:
      "border-[#b9a99a]/55 bg-gradient-to-br from-[#efe6dc] via-[#c9b8a8] to-[#8f7f72] text-[#1c1612] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]",
    label: "text-[#d4c4b4]",
  },
  3: {
    badge:
      "border-[#6a6a6a]/80 bg-gradient-to-br from-[#4a4a4a] via-[#2e2e2e] to-[#1a1a1a] text-[#f0f0f0] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]",
    label: "text-[#cfcfcf]",
  },
  4: {
    badge:
      "border-transparent bg-black text-[#f5f5f5] relative overflow-hidden shadow-[0_0_0_1px_#9a9a9a,0_0_0_2px_#000,0_0_12px_rgba(200,200,200,0.35),inset_0_1px_0_rgba(255,255,255,0.25)]",
    label: "text-[#f5f5f5]",
    sheen:
      "pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,0.28)_0%,transparent_35%,transparent_55%,rgba(255,255,255,0.1)_100%)]",
  },
};

export default function TierBadge({ tier, size = "sm" }: Props) {
  // Tier 4 is BLACK, and it has its own mark.
  if (tier === 4) return <BlackBadge size={size === "md" ? "md" : "sm"} />;

  if (!tier) {
    return (
      <span
        className={`inline-block font-semibold text-muted ${
          size === "md" ? "text-[11px]" : "text-[10px]"
        }`}
      >
        Unverified
      </span>
    );
  }

  const style = TIER_CARD[tier];
  const pad = size === "md" ? "px-3 py-1.5 text-[11px]" : "px-2.5 py-1 text-[10px]";

  return (
    <span
      className={`relative inline-block border font-semibold uppercase tracking-wide ${style.badge} ${pad}`}
      title={formatTierLabel(tier)}
    >
      <span className="relative">{formatTierLabel(tier)}</span>
    </span>
  );
}
