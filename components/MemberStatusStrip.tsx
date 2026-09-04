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
    <div className="mb-5 flex flex-wrap items-center gap-2">
      <span
        className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.18em] ${
          premier
            ? "border-accent/45 bg-accent/[0.08] text-accent"
            : "border-white/12 bg-white/[0.03] text-muted"
        }`}
        title={premier ? "Conclave Premier" : "Free member"}
      >
        {premier ? (onTrial ? "Premier · Trial" : "Conclave Premier") : "Free member"}
      </span>

      <TierBadge tier={tier} size="sm" />

      {black && !(tier === 4) ? <BlackBadge size="sm" /> : null}

      {connections > 0 ? (
        <BlackConnectionBadge count={connections} showCount />
      ) : null}
    </div>
  );
}
