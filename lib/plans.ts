import { blackConnectionUnlocksReach } from "./black";
import type { MemberTier } from "./tiers";
import type { MyProfile, PremierInterval } from "./types";

export const PREMIER_MONTHLY_USD = 20;
export const PREMIER_YEARLY_USD = 100;
export const PREMIER_TRIAL_DAYS = 3;

/** Premier unlocks Member → Verified & BLACK introductions. */
export const PREMIER_PLAN = {
  id: "conclave-premier",
  name: "Conclave Premier",
  tagline: "Meet every level in the room.",
  features: [
    "Introduce yourself to Verified & BLACK",
    "BLACK members can still meet anyone freely",
    "Priority placement in The Room",
    "Cancel anytime",
  ],
  monthly: {
    priceUsd: PREMIER_MONTHLY_USD,
    label: "Monthly",
    priceLabel: `$${PREMIER_MONTHLY_USD}/mo`,
    trialDays: 0,
  },
  yearly: {
    priceUsd: PREMIER_YEARLY_USD,
    label: "Yearly",
    priceLabel: `$${PREMIER_YEARLY_USD}/yr`,
    trialDays: PREMIER_TRIAL_DAYS,
    trialNote: `${PREMIER_TRIAL_DAYS}-day free trial, then $${PREMIER_YEARLY_USD}/year`,
  },
};

export function trialEndsAt(from = new Date(), days = PREMIER_TRIAL_DAYS): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function isPremierOnTrial(profile: MyProfile | null | undefined): boolean {
  const plan = profile?.premierPlan;
  if (!plan?.active || !plan.trialEndsAt) return false;
  return new Date(plan.trialEndsAt).getTime() > Date.now();
}

/** Active if subscribed — including during free trial. */
export function hasActivePremier(profile: MyProfile | null | undefined): boolean {
  const plan = profile?.premierPlan;
  if (!plan?.active) return false;
  // Trial still counts as Premier access
  if (plan.trialEndsAt && new Date(plan.trialEndsAt).getTime() > Date.now()) return true;
  // After trial (or monthly with no trial), stay active until cancelled
  return true;
}

export function premierStatusLabel(profile: MyProfile | null | undefined): string {
  const plan = profile?.premierPlan;
  if (!plan?.active) return "Inactive";
  if (isPremierOnTrial(profile)) {
    const end = new Date(plan.trialEndsAt!);
    return `Free trial · ends ${end.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  }
  return plan.interval === "year" ? "Yearly · $100/yr" : "Monthly · $20/mo";
}

/**
 * Access rules:
 * - BLACK: meet any level
 * - Premier: meet any level
 * - Enough BLACK connections: reach earned through the network, no Premier needed
 * - Member without Premier: only other Members
 * - Verified: meet anyone
 */
export function canIntroduceToTier(
  myTier: MemberTier | null,
  theirTier: MemberTier | null,
  premier: boolean,
  myBlackConnections = 0
): boolean {
  const mine = myTier ?? 1;
  const theirs = theirTier ?? 1;
  if (mine === 3) return true;
  if (premier) return true;
  if (blackConnectionUnlocksReach(myBlackConnections)) return true;
  if (mine === 1 && theirs > 1) return false;
  return true;
}

export function formatPremierPrice(interval: PremierInterval = "month"): string {
  return interval === "year"
    ? PREMIER_PLAN.yearly.priceLabel
    : PREMIER_PLAN.monthly.priceLabel;
}
