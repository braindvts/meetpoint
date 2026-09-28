import type { Prisma } from "@prisma/client";

/** Discover returns this many ranked people. The scan still covers the full pool. */
export const DISCOVER_RESULT_CAP = 100;

/**
 * Columns Discover reads to rank and to build a public card.
 * Email, password hash, phone, and OAuth ids are intentionally absent.
 */
export const discoverMemberSelect = {
  id: true,
  name: true,
  jobTitle: true,
  company: true,
  industry: true,
  bio: true,
  photo: true,
  cityName: true,
  cityCountry: true,
  cityLat: true,
  cityLng: true,
  travel: true,
  lookingForJson: true,
  ideaTagsJson: true,
  verificationsJson: true,
  workJson: true,
  black: true,
  updatedAt: true,
  interests: { select: { slug: true } },
} as const satisfies Prisma.MemberSelect;

export type DiscoverMember = Prisma.MemberGetPayload<{ select: typeof discoverMemberSelect }>;
