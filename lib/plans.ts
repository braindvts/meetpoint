import type { MemberTier } from "./tiers";

/**
 * Access rules (no Premier):
 * - BLACK / Verified: meet any level
 * - Member: only other Members — get Verified to reach further
 */
export function canIntroduceToTier(
  myTier: MemberTier | null,
  theirTier: MemberTier | null
): boolean {
  const mine = myTier ?? 1;
  const theirs = theirTier ?? 1;
  if (mine >= 2) return true;
  return theirs === 1;
}
