import type { Member } from "@prisma/client";
import { memberToProfile } from "@/lib/memberMap";
import { tierForProfile, type MemberTier } from "@/lib/tiers";
import type { MyProfile } from "@/lib/types";

/** Standing used for introduction rules. Computed from stored fields only. */
export function standingTierFromProfile(
  profile: MyProfile,
  meetingsAttended: number
): MemberTier {
  return tierForProfile(profile, meetingsAttended);
}

export function standingTier(member: Member): MemberTier {
  return standingTierFromProfile(memberToProfile(member), member.meetingsAttended);
}
