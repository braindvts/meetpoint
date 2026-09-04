import type { MyProfile, Person, PersonWork, ReputationSummary, Verification } from "./types";

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
    meaning: "Identity and a complete professional profile",
    howToEarn: "Verify + finish the basics (photo, role, what you’re looking for)",
  },
  {
    tier: 2,
    name: "Trusted",
    meaning: "A fuller profile — work email, projects, links — or real dinners",
    howToEarn: "Add work email, projects, and links — or attend 5+ meetings",
  },
  {
    tier: 3,
    name: "Connector",
    meaning: "A rich public record of what you build",
    howToEarn: "Work email + several projects and credentials — or 20+ meetings",
  },
  {
    tier: 4,
    name: "BLACK",
    meaning: "Premium verified professional — paid or earned",
    howToEarn: "Purchase BLACK, or earn it through standing and real dinners",
  },
];

export const TIER_THRESHOLDS = {
  trustedMeetings: 5,
  trustedScore: 80,
  trustedProfile: 55,
  connectorMeetings: 20,
  connectorScore: 90,
  connectorProfile: 80,
  blackScore: 95,
} as const;

export interface ProfileStrength {
  score: number;
  max: number;
  extras: string[];
  missing: string[];
}

export interface TierInput {
  verified: boolean;
  profileComplete: boolean;
  meetingsAttended: number;
  reputationScore: number;
  profileStrength?: number;
  /** BLACK standing — paid, earned, or granted. */
  black?: boolean;
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

function hasMethod(vers: Verification[] | undefined, method: string): boolean {
  return (vers || []).some((v) => v.method === method && String(v.value || "").trim());
}

function workList(profile: Pick<MyProfile, "work"> | Person): PersonWork[] {
  if ("work" in profile && profile.work) return profile.work.filter((w) => w.title?.trim());
  return [];
}

/** 0–100 based on work email, projects, links, bio — extras beyond the basics. */
export function scoreProfileStrength(
  profile: Pick<MyProfile, "verifications" | "bio" | "phone" | "work" | "ideaTags" | "lookingFor">
): ProfileStrength {
  const extras: string[] = [];
  const missing: string[] = [];
  let score = 0;
  const max = 100;

  if (hasMethod(profile.verifications, "company-email")) {
    score += 22;
    extras.push("Work email");
  } else missing.push("Work email");

  if (hasMethod(profile.verifications, "linkedin")) {
    score += 12;
    extras.push("LinkedIn");
  } else missing.push("LinkedIn");

  if (hasMethod(profile.verifications, "website")) {
    score += 12;
    extras.push("Website");
  } else missing.push("Website");

  if (hasMethod(profile.verifications, "portfolio")) {
    score += 12;
    extras.push("Portfolio");
  } else missing.push("Portfolio");

  if (hasMethod(profile.verifications, "registration")) {
    score += 8;
    extras.push("Registration");
  }

  const bio = (profile.bio || "").trim();
  if (bio.length >= 40) {
    score += 10;
    extras.push("About you");
  } else missing.push("A longer about (40+ characters)");

  if (profile.phone?.trim()) {
    score += 6;
    extras.push("Phone");
  }

  const projects = workList(profile);
  const projectPts = Math.min(24, projects.length * 8);
  score += projectPts;
  if (projects.length > 0) extras.push(`${projects.length} project${projects.length === 1 ? "" : "s"}`);
  else missing.push("Projects you’ve built");

  if ((profile.ideaTags?.length ?? 0) >= 3) score += 4;
  if ((profile.lookingFor?.length ?? 0) >= 2) score += 4;

  return { score: Math.min(max, score), max, extras, missing };
}

/**
 * Highest tier the member currently qualifies for.
 * Tier 1 = verified + basics.
 * Higher tiers from a richer profile (email, projects, links) and/or real dinners.
 */
export function computeMemberTier(input: TierInput): MemberTier | null {
  if (!input.verified || !input.profileComplete) return null;

  const { meetingsAttended: m, reputationScore: score, black } = input;
  const strength = input.profileStrength ?? 0;
  const T = TIER_THRESHOLDS;

  if (black || (m >= T.connectorMeetings && score >= T.blackScore && strength >= 70)) return 4;
  if (
    (m >= T.connectorMeetings && score >= T.connectorScore) ||
    strength >= T.connectorProfile
  ) {
    return 3;
  }
  if ((m >= T.trustedMeetings && score >= T.trustedScore) || strength >= T.trustedProfile) {
    return 2;
  }
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
      hint: "Complete your profile and add a verification to enter Tier 1.",
    };
  }
  if (current === 4) {
    return { current, next: null, hint: "BLACK standing. You set the standard." };
  }
  const next = TIER_DEFINITIONS[current];
  const T = TIER_THRESHOLDS;
  const strength = input.profileStrength ?? 0;
  if (current === 1) {
    return {
      current,
      next,
      hint:
        strength < T.trustedProfile
          ? "Add a work email, projects, and links to reach Trusted — or attend 5 dinners."
          : "Keep high ratings from dinners to stay Trusted.",
    };
  }
  if (current === 2) {
    return {
      current,
      next,
      hint:
        strength < T.connectorProfile
          ? "Add more projects and credentials (work email, site, portfolio) to reach Connector."
          : "Excellent reviews from dinners keep Connector standing.",
    };
  }
  return {
    current,
    next,
    hint: "Purchase BLACK, or reach it through exceptional dinners and a full profile.",
  };
}

export function tierForPerson(
  person: Person,
  reputation: ReputationSummary
): MemberTier | null {
  const meetings = reputation.ratingCount;
  const vers = (person.verifications || []).map((method) => ({
    method,
    value: "verified",
    verifiedAt: "",
  }));
  const strength = scoreProfileStrength({
    verifications: vers,
    bio: person.bio,
    work: person.work,
    ideaTags: person.ideaTags,
    lookingFor: person.lookingFor,
  }).score;
  return computeMemberTier({
    verified: (person.verifications?.length ?? 0) > 0,
    profileComplete: true,
    meetingsAttended: meetings,
    reputationScore: reputation.score,
    profileStrength: strength,
    black: person.black === true,
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
    profileStrength: scoreProfileStrength(profile).score,
    black: profile.black === true,
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
