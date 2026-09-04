/**
 * BLACK — the top of the Conclave ladder. A member is BLACK because they paid
 * for it or earned it, never because someone handed it over.
 *
 * BLACK CONNECTION is a separate, secondary credential: proof that someone has
 * built a real private or professional relationship inside the BLACK network.
 * The two never convert into one another.
 */

export type BlackSource = "paid" | "earned" | "granted";

export type BlackInviteKind = "connection" | "meeting";
export type BlackInviteStatus = "pending" | "accepted" | "declined";
export type BlackConnectionSource = "invite" | "meeting";

/** Price of BLACK. Premier stays the cheaper tier below it. */
export const BLACK_MONTHLY_USD = 50;
export const BLACK_YEARLY_USD = 500;

/** What a member must reach to earn BLACK without paying. */
export const BLACK_EARNED_REQUIREMENTS = {
  meetings: 20,
  reputationScore: 95,
  profileStrength: 70,
} as const;

/**
 * BLACK CONNECTION standing. Thresholds are here on purpose — change the
 * numbers and every surface follows.
 */
export const BLACK_CONNECTION_LEVELS = [
  {
    atLeast: 1,
    name: "Connected",
    benefit: "Your BLACK CONNECTION credential appears on your card.",
  },
  {
    atLeast: 3,
    name: "Established",
    benefit: "Stronger placement in Discover for BLACK members.",
  },
  {
    atLeast: 5,
    name: "Trusted inside BLACK",
    benefit: "Introductions to BLACK members without Premier.",
  },
] as const;

export interface BlackConnectionLevel {
  count: number;
  /** null until the first connection lands. */
  name: string | null;
  next: { atLeast: number; name: string; benefit: string } | null;
  benefits: string[];
}

export function blackConnectionLevel(count: number): BlackConnectionLevel {
  const reached = BLACK_CONNECTION_LEVELS.filter((l) => count >= l.atLeast);
  const next = BLACK_CONNECTION_LEVELS.find((l) => count < l.atLeast) || null;
  return {
    count,
    name: reached.length ? reached[reached.length - 1].name : null,
    next: next ? { ...next } : null,
    benefits: reached.map((l) => l.benefit),
  };
}

/** Shown on a card once someone holds at least one BLACK connection. */
export function hasBlackConnection(count: number | undefined | null): boolean {
  return (count ?? 0) >= BLACK_CONNECTION_LEVELS[0].atLeast;
}

/** The 5+ tier lets someone reach BLACK members without paying for Premier. */
export function blackConnectionUnlocksReach(count: number | undefined | null): boolean {
  const top = BLACK_CONNECTION_LEVELS[BLACK_CONNECTION_LEVELS.length - 1];
  return (count ?? 0) >= top.atLeast;
}

export function formatBlackPrice(interval: "month" | "year"): string {
  return interval === "year" ? `$${BLACK_YEARLY_USD}/yr` : `$${BLACK_MONTHLY_USD}/mo`;
}

/**
 * Whether a member qualifies to earn BLACK. Deliberately mirrors the tier-4
 * rule in lib/tiers.ts so paying and earning land in the same place.
 */
export function qualifiesForEarnedBlack(input: {
  verified: boolean;
  meetingsAttended: number;
  reputationScore: number;
  profileStrength: number;
}): boolean {
  const r = BLACK_EARNED_REQUIREMENTS;
  return (
    input.verified &&
    input.meetingsAttended >= r.meetings &&
    input.reputationScore >= r.reputationScore &&
    input.profileStrength >= r.profileStrength
  );
}

/** Only a pairing with exactly one BLACK member can form a BLACK connection. */
export function canFormBlackConnection(a: { black: boolean }, b: { black: boolean }): boolean {
  return a.black !== b.black;
}

export const BLACK_LABEL = "BLACK";
export const BLACK_CONNECTION_LABEL = "BLACK CONNECTION";
