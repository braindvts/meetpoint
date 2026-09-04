import { prisma } from "@/lib/db";
import {
  DEMO_OWNER_EMAIL,
  DEMO_OWNER_PASSWORD,
  DEMO_OWNER_PROFILE,
  isDemoOwnerEmail,
  isDemoOwnerPassword,
} from "@/lib/demoOwner";
import { profileToMemberData } from "@/lib/memberMap";
import { hashPassword } from "@/lib/password";

/**
 * Creates or refreshes the fixed Brian demo account so email sign-in always
 * works with the published credentials, even on a fresh database.
 */
export async function ensureDemoOwner() {
  const email = DEMO_OWNER_EMAIL;
  const profile = {
    ...DEMO_OWNER_PROFILE,
    verifications: DEMO_OWNER_PROFILE.verifications.map((v) => ({
      ...v,
      verifiedAt: new Date().toISOString(),
    })),
    premierPlan: {
      active: true as const,
      startedAt: new Date().toISOString(),
      interval: "year" as const,
      trialEndsAt: new Date(Date.now() + 3 * 86400000).toISOString(),
    },
  };
  const data = {
    ...profileToMemberData(profile),
    email,
    passwordHash: hashPassword(DEMO_OWNER_PASSWORD),
  };

  const existing = await prisma.member.findFirst({ where: { email } });
  if (existing) {
    return prisma.member.update({
      where: { id: existing.id },
      data,
    });
  }
  return prisma.member.create({ data });
}

export function matchesDemoOwner(email: string, password: string): boolean {
  return isDemoOwnerEmail(email) && isDemoOwnerPassword(password);
}
