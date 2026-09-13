import { prisma } from "@/lib/db";
import { WALKTHROUGH_OWNER_PROFILE } from "@/lib/demoOwner";
import { profileToMemberData } from "@/lib/memberMap";
import { hashPassword } from "@/lib/password";
import { walkthroughOwnerCredentials } from "@/lib/walkthroughOwner";

export {
  matchesWalkthroughOwner as matchesDemoOwner,
  walkthroughOwnerEnabled,
  walkthroughOwnerCredentials,
} from "@/lib/walkthroughOwner";

/**
 * Create the walkthrough member if that mailbox is unused.
 * Never overwrites an existing row — including OAuth members.
 */
export async function provisionWalkthroughOwnerIfAbsent() {
  const creds = walkthroughOwnerCredentials();
  if (!creds) return null;

  const existing = await prisma.member.findFirst({ where: { email: creds.email } });
  if (existing) return existing;

  const now = new Date().toISOString();
  const profile = {
    ...WALKTHROUGH_OWNER_PROFILE,
    verifications: WALKTHROUGH_OWNER_PROFILE.verifications.map((v) =>
      v.method === "company-email"
        ? { ...v, value: creds.email, verifiedAt: now }
        : { ...v, verifiedAt: now }
    ),
  };

  try {
    return await prisma.member.create({
      data: {
        ...profileToMemberData(profile),
        verificationsJson: JSON.stringify(profile.verifications),
        meetingsAttended: profile.meetingsAttended || 0,
        email: creds.email,
        passwordHash: hashPassword(creds.password),
      },
    });
  } catch {
    return prisma.member.findFirst({ where: { email: creds.email } });
  }
}

export const ensureDemoOwner = provisionWalkthroughOwnerIfAbsent;
