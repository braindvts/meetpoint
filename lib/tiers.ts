import { BLACK_EARNED_REQUIREMENTS } from "./black";
import type { MyProfile, Person, PersonWork, ReputationSummary, Verification } from "./types";

/** Conclave standing — only three levels. */
export type MemberTier = 1 | 2 | 3;

export interface TierDefinition {
  tier: MemberTier;
  name: string;
  meaning: string;
  howToEarn: string;
}

export const TIER_DEFINITIONS: TierDefinition[] = [
  {
    tier: 1,
    name: "Member",
    meaning: "You’re in the room — finish your profile to get verified",
    howToEarn: "Create your Conclave account",
  },
  {
    tier: 2,
    name: "Verified",
    meaning: "Identity confirmed and a complete professional profile",
    howToEarn: "Finish your profile and add a verification",
  },
  {
    tier: 3,
    name: "BLACK",
    meaning: "Premium verified professional — paid or earned",
    howToEarn: "Purchase BLACK, or earn it through standing and real dinners",
  },
];

/** Kept for reputation heuristics and earned-BLACK gates. */
export const TIER_THRESHOLDS = {
  trustedMeetings: 5,
  trustedScore: 80,
  trustedProfile: 55,
  connectorMeetings: BLACK_EARNED_REQUIREMENTS.meetings,
  connectorScore: 90,
  connectorProfile: 80,
  blackScore: BLACK_EARNED_REQUIREMENTS.reputationScore,
  blackProfile: BLACK_EARNED_REQUIREMENTS.profileStrength,
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

/** 0–100 based on email, projects, links, bio — extras beyond the basics. */
export function scoreProfileStrength(
  profile: Pick<MyProfile, "verifications" | "bio" | "phone" | "work" | "ideaTags" | "lookingFor">
): ProfileStrength {
  const extras: string[] = [];
  const missing: string[] = [];
  let score = 0;
  const max = 100;

  if (hasMethod(profile.verifications, "company-email")) {
    score += 22;
    extras.push("Email");
  } else missing.push("Email");

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
 * Highest level the member currently qualifies for.
 * Member → Verified → BLACK.
 */
export function computeMemberTier(input: TierInput): MemberTier {
  const { meetingsAttended: m, reputationScore: score, black } = input;
  const strength = input.profileStrength ?? 0;
  const earned =
    input.verified &&
    input.profileComplete &&
    m >= TIER_THRESHOLDS.connectorMeetings &&
    score >= TIER_THRESHOLDS.blackScore &&
    strength >= TIER_THRESHOLDS.blackProfile;

  if (black || earned) return 3;
  if (input.verified && input.profileComplete) return 2;
  return 1;
}

export function nextTierProgress(input: TierInput): {
  current: MemberTier;
  next: TierDefinition | null;
  hint: string;
} {
  const current = computeMemberTier(input);
  if (current === 3) {
    return { current, next: null, hint: "BLACK standing. You set the standard." };
  }
  if (current === 1) {
    return {
      current,
      next: TIER_DEFINITIONS[1],
      hint: "Add a photo, role, interests, what you’re looking for, and one verification to become Verified.",
    };
  }
  return {
    current,
    next: TIER_DEFINITIONS[2],
    hint: "Purchase BLACK, or earn it through exceptional dinners and a full profile.",
  };
}

export function tierForPerson(
  person: Person,
  reputation: ReputationSummary
): MemberTier {
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
): MemberTier {
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

/** Short level name only — no “Tier N ·” prefix. */
export function formatTierLabel(tier: MemberTier): string {
  return tierDefinition(tier).name;
}
