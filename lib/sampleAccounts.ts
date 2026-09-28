import type { Prisma } from "@prisma/client";

/**
 * How a row is recognized as a sample, guest, or bot.
 *
 * Any one marker is enough. Real signups do not match these.
 * This module never deletes rows — scripts/cleanup-sample-accounts.ts does,
 * and only when an operator passes --apply after a backup.
 */
export const LEGACY_SEED_IDS = Array.from({ length: 18 }, (_, i) => `p${i + 1}`);

/** LinkedIn URL baked into the "Enter as Mohammed" guest profile. */
export const GUEST_PROFILE_MARKER = "conclave-demo";

/**
 * Exact guest mailbox from the Mohammed demo profile.
 * Other @conclave.app addresses are real accounts and are not samples.
 */
export const KNOWN_SAMPLE_EMAILS = ["demo@conclave.app"] as const;

/** Portrait host used by the seeded sample people. */
export const SAMPLE_PHOTO_HOST = "randomuser.me";

export type SampleKind = "seed" | "guest" | "bot" | "sample";

export interface SampleProbe {
  id: string;
  email?: string | null;
  photo?: string | null;
  verificationsJson?: string | null;
  linkedInId?: string | null;
  isSample?: boolean | null;
  sampleKind?: string | null;
}

const SEED_IDS = new Set(LEGACY_SEED_IDS);
const SAMPLE_EMAILS = new Set<string>(KNOWN_SAMPLE_EMAILS);

/** Which known markers hit this row. Empty means a real member. */
export function sampleMarkers(row: SampleProbe): string[] {
  const markers: string[] = [];
  if (SEED_IDS.has(row.id)) markers.push("id:p1-p18");
  const email = (row.email || "").trim().toLowerCase();
  if (email && SAMPLE_EMAILS.has(email)) markers.push(`email:${email}`);
  const verifications = (row.verificationsJson || "").toLowerCase();
  const linkedInId = (row.linkedInId || "").toLowerCase();
  if (verifications.includes(GUEST_PROFILE_MARKER)) markers.push("verifications:conclave-demo");
  if (linkedInId.includes(GUEST_PROFILE_MARKER)) markers.push("linkedInId:conclave-demo");
  if ((row.photo || "").toLowerCase().includes(SAMPLE_PHOTO_HOST)) markers.push("photo:randomuser.me");
  if (row.isSample) markers.push("isSample");
  const kind = (row.sampleKind || "").trim();
  if (kind) markers.push(`sampleKind:${kind}`);
  return markers;
}

export function classifySample(row: SampleProbe): SampleKind | null {
  const markers = sampleMarkers(row);
  if (!markers.length) return null;
  if (markers.some((marker) => marker.startsWith("id:"))) return "seed";
  if (
    markers.some(
      (marker) =>
        marker.startsWith("email:") ||
        marker.startsWith("verifications:") ||
        marker.startsWith("linkedInId:")
    )
  ) {
    return "guest";
  }
  if (markers.some((marker) => marker.startsWith("photo:"))) return "bot";
  const kind = (row.sampleKind || "").trim();
  if (kind === "seed" || kind === "guest" || kind === "bot" || kind === "sample") return kind;
  if (row.isSample || kind) return "sample";
  return null;
}

export function isSampleAccount(row: SampleProbe): boolean {
  return classifySample(row) !== null;
}

/** Prisma filter matching the same markers. Safe to negate for real-member queries. */
export function sampleMemberWhere(): Prisma.MemberWhereInput {
  return {
    OR: [
      { isSample: true },
      { sampleKind: { not: "" } },
      { id: { in: LEGACY_SEED_IDS } },
      { verificationsJson: { contains: GUEST_PROFILE_MARKER, mode: "insensitive" } },
      // Nullable columns must be guarded. `ILIKE` on NULL is NULL, and
      // NOT (… OR NULL) drops real members from the room.
      {
        AND: [
          { linkedInId: { not: null } },
          { linkedInId: { contains: GUEST_PROFILE_MARKER, mode: "insensitive" } },
        ],
      },
      {
        AND: [
          { email: { not: null } },
          { email: { in: [...KNOWN_SAMPLE_EMAILS], mode: "insensitive" } },
        ],
      },
      { photo: { contains: SAMPLE_PHOTO_HOST, mode: "insensitive" } },
    ],
  };
}
