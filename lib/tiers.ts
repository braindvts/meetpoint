import type { MyProfile, Person, ReputationSummary } from "./types";

/** Membership standing in the Conclave. */
export type MemberTier = 1 | 2 | 3 | 4;

export interface TierDefinition {
  tier: MemberTier;
  name: string;
  meaning: string;
  howToEarn: string;
}

export const TIER_DEFINITIONS: TierDefinition[] = [
  {
    tier: 1,
    name: "Verified",
    meaning: "Identity and professional profile verified",
    howToEarn: "Verify identity, LinkedIn/company, complete profile",
  },
  {
    tier: 2,
    name: "Trusted",
    meaning: "Has attended meetings and received positive feedback",
    howToEarn: "Attend 5+ meetings with high ratings",
  },
  {
    tier: 3,
    name: "Connector",
    meaning: "Regularly builds valuable connections",
    howToEarn: "20+ successful meetings, excellent reviews",
  },
  {
    tier: 4,
    name: "Elite",
    meaning: "Highly respected community member",
    howToEarn: "Exceptional reputation, invited or earned",
  },
];

export const TIER_THRESHOLDS = {
  trustedMeetings: 5,
  trustedScore: 80,
  connectorMeetings: 20,
  connectorScore: 90,
  eliteScore: 95,
} as const;

/** Demo meeting counts so peers show a mix of tiers in The Room. */
const SEED_MEETINGS: Record<string, number> = {
  p1: 6,
  p2: 22,
  p3: 4,
  p4: 8,
  p5: 2,
  p6: 28,
  p7: 5,
  p8: 12,
  p9: 7,
  p10: 3,
  p11: 35,
  p12: 1,
  p13: 9,
  p14: 6,
  p15: 0,
  p16: 21,
  p17: 4,
  p18: 40,
};

export interface TierInput {
  verified: boolean;
  profileComplete: boolean;
  meetingsAttended: number;
  reputationScore: number;
  /** Explicit Elite invite (or earned flag). */
  elite?: boolean;
}

export function tierDefinition(tier: MemberTier): TierDefinition {
  return TIER_DEFINITIONS[tier - 1];
}

export function isProfileComplete(profile: Pick<
  MyProfile,
  "name" | "photo" | "jobTitle" | "lookingFor" | "ideaTags" | "verifications"
>): boolean {
  return (
    !!profile.name?.trim() &&
    !!profile.photo &&
    !!profile.jobTitle?.trim() &&
    (profile.lookingFor?.length ?? 0) > 0 &&
    (profile.ideaTags?.length ?? 0) > 0 &&
    (profile.verifications?.length ?? 0) > 0
  );
}

/**
 * Highest tier the member currently qualifies for.
 * Tier 1 requires verification + complete profile.
 * Higher tiers require meeting count + reputation score (or Elite invite).
 */
export function computeMemberTier(input: TierInput): MemberTier | null {
  if (!input.verified || !input.profileComplete) return null;

  const { meetingsAttended: m, reputationScore: score, elite } = input;
  const T = TIER_THRESHOLDS;

  if (elite || (m >= T.connectorMeetings && score >= T.eliteScore)) return 4;
  if (m >= T.connectorMeetings && score >= T.connectorScore) return 3;
  if (m >= T.trustedMeetings && score >= T.trustedScore) return 2;
  return 1;
}

export function nextTierProgress(input: TierInput): {
  current: MemberTier | null;
  next: TierDefinition | null;
  hint: string;
} {
  const current = computeMemberTier(input);
  if (current === null) {
    return {
      current: null,
      next: TIER_DEFINITIONS[0],
      hint: "Complete your profile and verify with LinkedIn or company credentials.",
    };
  }
  if (current === 4) {
    return { current, next: null, hint: "Elite standing. You set the standard." };
  }
  const next = TIER_DEFINITIONS[current];
  const T = TIER_THRESHOLDS;
  if (current === 1) {
    const need = Math.max(0, T.trustedMeetings - input.meetingsAttended);
    return {
      current,
      next,
      hint:
        need > 0
          ? `${need} more meeting${need === 1 ? "" : "s"} with strong feedback unlocks Trusted.`
          : "Keep high ratings to unlock Trusted.",
    };
  }
  if (current === 2) {
    const need = Math.max(0, T.connectorMeetings - input.meetingsAttended);
    return {
      current,
      next,
      hint:
        need > 0
          ? `${need} more successful meeting${need === 1 ? "" : "s"} with excellent reviews unlocks Connector.`
          : "Excellent reviews unlock Connector.",
    };
  }
  return {
    current,
    next,
    hint: "Exceptional reputation — or an Elite invitation — unlocks Elite.",
  };
}

export function tierForPerson(
  person: Person,
  reputation: ReputationSummary
): MemberTier | null {
  const meetings = SEED_MEETINGS[person.id] ?? reputation.ratingCount;
  return computeMemberTier({
    verified: (person.verifications?.length ?? 0) > 0,
    profileComplete: true,
    meetingsAttended: meetings,
    reputationScore: reputation.score,
    elite: person.id === "p11" || person.id === "p18",
  });
}

export function tierForProfile(
  profile: MyProfile,
  meetingsAttended: number
): MemberTier | null {
  let score = 100;
  if (meetingsAttended >= TIER_THRESHOLDS.connectorMeetings) score = 92;
  else if (meetingsAttended >= TIER_THRESHOLDS.trustedMeetings) score = 85;

  return computeMemberTier({
    verified: (profile.verifications?.length ?? 0) > 0,
    profileComplete: isProfileComplete(profile),
    meetingsAttended,
    reputationScore: score,
    elite: profile.elite === true,
  });
}

export function reputationScoreForMeetings(meetingsAttended: number): number {
  if (meetingsAttended >= TIER_THRESHOLDS.connectorMeetings) return 92;
  if (meetingsAttended >= TIER_THRESHOLDS.trustedMeetings) return 85;
  return 100;
}

export function formatTierLabel(tier: MemberTier): string {
  const d = tierDefinition(tier);
  return `Tier ${tier} · ${d.name}`;
}
