"use client";

import { useEffect, useState } from "react";
import BlackBadge from "@/components/BlackBadge";
import BlackConnectionBadge from "@/components/BlackConnectionBadge";
import TierBadge from "@/components/TierBadge";
import { myBlackConnectionCount } from "@/lib/blackStore";
import type { MemberTier } from "@/lib/tiers";
import type { MyProfile } from "@/lib/types";

interface Props {
  profile: MyProfile;
  tier: MemberTier | null;
}

/**
 * Standing row: Free / Verified / BLACK check + trusted blue check.
 */
export default function MemberStatusStrip({ profile, tier }: Props) {
  const [connections, setConnections] = useState(0);

  useEffect(() => {
    const sync = () => setConnections(myBlackConnectionCount());
    sync();
    window.addEventListener("meetpoint:black-changed", sync);
    return () => window.removeEventListener("meetpoint:black-changed", sync);
  }, []);

  const black = profile.black === true;

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      <span
        className="inline-flex shrink-0 items-center border border-white/12 bg-transparent px-2 py-1 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-muted"
        title="Free standing — get Verified to meet anyone"
      >
        Free member
      </span>

      <TierBadge tier={tier} size="sm" />

      {black && tier !== 3 ? <BlackBadge size="sm" /> : null}

      {connections > 0 ? (
        <BlackConnectionBadge count={connections} showCount />
      ) : null}
    </div>
  );
}
