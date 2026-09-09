import { prisma } from "@/lib/db";
import { DEMO_OWNER_EMAIL, DEMO_OWNER_PROFILE } from "@/lib/demoOwner";
import { demoOwnerPassword, matchesDemoOwner } from "@/lib/demoOwnerServer";
import { profileToMemberData } from "@/lib/memberMap";
import { hashPassword } from "@/lib/password";

export { matchesDemoOwner };

/**
 * Creates or refreshes the fixed Brian demo account so email sign-in always
 * works with the published credentials, even on a fresh database.
 */
export async function ensureDemoOwner() {
  const email = DEMO_OWNER_EMAIL;
  const password = demoOwnerPassword();
  const existing = await prisma.member.findFirst({ where: { email } });

  if (existing) {
    return prisma.member.update({
      where: { id: existing.id },
      data: {
        email,
        passwordHash: hashPassword(password),
        name: existing.name?.trim() ? existing.name : DEMO_OWNER_PROFILE.name,
        photo: existing.photo?.trim() ? existing.photo : DEMO_OWNER_PROFILE.photo,
        jobTitle: existing.jobTitle?.trim()
          ? existing.jobTitle
          : DEMO_OWNER_PROFILE.jobTitle,
      },
    });
  }

  const profile = {
    ...DEMO_OWNER_PROFILE,
    verifications: DEMO_OWNER_PROFILE.verifications.map((v) => ({
      ...v,
      verifiedAt: new Date().toISOString(),
    })),
  };

  return prisma.member.create({
    data: {
      ...profileToMemberData(profile),
      verificationsJson: JSON.stringify(profile.verifications),
      meetingsAttended: profile.meetingsAttended || 0,
      email,
      passwordHash: hashPassword(password),
    },
  });
}
