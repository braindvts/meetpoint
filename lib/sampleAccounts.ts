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

/**
 * Seed portraits only. The host publishes men/0.jpg–men/99.jpg and the same
 * for women. A URL that merely contains "randomuser.me" is not a sample.
 * Anchored to the full string so a real member's CDN link cannot match.
 */
export const SAMPLE_PORTRAIT_RE =
  /^https:\/\/randomuser\.me\/api\/portraits\/(?:men|women)\/(?:0|[1-9][0-9]?)\.jpg$/i;

const SAMPLE_PORTRAIT_URLS = (["men", "women"] as const).flatMap((folder) =>
  Array.from({ length: 100 }, (_, n) => `https://randomuser.me/api/portraits/${folder}/${n}.jpg`)
);

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
  if (isSamplePortraitUrl(row.photo)) markers.push("photo:randomuser.me");
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

/** True only for the exact seed portrait URL, not for any other use of that host. */
export function isSamplePortraitUrl(photo: string | null | undefined): boolean {
  return SAMPLE_PORTRAIT_RE.test((photo || "").trim());
}

/**
 * Any photo hosted on randomuser.me. Real members cannot save these.
 * A non-portrait path on that host is still rejected, and it is not a sample.
 */
export function isRandomUserPhotoHost(photo: string | null | undefined): boolean {
  const value = (photo || "").trim();
  if (!value) return false;
  let host = "";
  try {
    host = new URL(value).hostname.toLowerCase();
  } catch {
    return false;
  }
  return host === "randomuser.me" || host.endsWith(".randomuser.me");
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
      { photo: { in: SAMPLE_PORTRAIT_URLS, mode: "insensitive" } },
    ],
  };
}
