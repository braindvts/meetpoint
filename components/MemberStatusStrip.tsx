"use client";

import { useEffect, useState } from "react";
import BlackBadge from "@/components/BlackBadge";
import BlackConnectionBadge from "@/components/BlackConnectionBadge";
import TierBadge from "@/components/TierBadge";
import { myBlackConnectionCount } from "@/lib/blackStore";
import { hasActivePremier, isPremierOnTrial } from "@/lib/plans";
import type { MemberTier } from "@/lib/tiers";
import type { MyProfile } from "@/lib/types";

interface Props {
  profile: MyProfile;
  tier: MemberTier | null;
}

/**
 * Everything a member currently is, in one row: their plan, their tier, BLACK
 * when they hold it, and the BLACK CONNECTION credential when they've earned it.
 */
export default function MemberStatusStrip({ profile, tier }: Props) {
  const [connections, setConnections] = useState(0);

  useEffect(() => {
    const sync = () => setConnections(myBlackConnectionCount());
    sync();
    window.addEventListener("meetpoint:black-changed", sync);
    return () => window.removeEventListener("meetpoint:black-changed", sync);
  }, []);

  const premier = hasActivePremier(profile);
  const onTrial = isPremierOnTrial(profile);
  const black = profile.black === true;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2">
      <span
        className={`tier-mark text-[10px] tracking-[0.16em] ${
          premier ? "tier-mark--verified" : "text-muted"
        }`}
        title={premier ? "Premier" : "Free member"}
      >
        <span className="tier-mark-bar" aria-hidden />
        {premier ? (onTrial ? "Premier · Trial" : "Premier") : "Free"}
      </span>

      <TierBadge tier={tier} size="sm" />

      {black && tier !== 3 ? <BlackBadge size="sm" /> : null}

      {connections > 0 ? (
        <BlackConnectionBadge count={connections} showCount />
      ) : null}
    </div>
  );
}
