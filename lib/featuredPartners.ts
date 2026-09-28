export type PartnerPermission = "approved" | "pending" | "revoked";

export interface FeaturedPartner {
  id: string;
  /** Name shown next to the mark. */
  name: string;
  /** Legal or trade name when it differs from the on-screen name. */
  legalName?: string;
  href: string;
  /** Public path of the mark. */
  logoSrc: string;
  logoAlt: string;
  /** Shown first and larger. */
  lead?: boolean;
  /**
   * Black artwork that should be inverted on the ink field.
   * Marks drawn for a dark ground — Grounded's white tile — stay as authored.
   */
  invertOnInk?: boolean;
  /**
   * Public surfaces render `approved` only.
   * TODO: written permission to display these marks is not in the repo.
   * `approved` keeps the live site unchanged until counsel confirms or revokes.
   */
  permission: PartnerPermission;
  /** ISO date to re-check written permission. */
  permissionReviewBy?: string;
  permissionNote?: string;
}

const PERMISSION_TODO =
  "TODO: written permission to display this mark is not in the repo and must be confirmed before launch. Status is approved so the current public site does not change.";

/**
 * Loading-screen credit. Append a partner to extend the line —
 * order is lead first, then the list as written.
 * BijuuFlow leads and uses the same destination and mark as the landing lockup.
 * Later partners follow in list order.
 */
export const FEATURED_PARTNERS: readonly FeaturedPartner[] = [
  {
    id: "bijuuflow",
    name: "BijuuFlow",
    href: "https://bijuuflow.com/terminal",
    logoSrc: "/bijuuflow-logo.svg",
    logoAlt: "BijuuFlow",
    lead: true,
    invertOnInk: true,
    permission: "approved",
    permissionReviewBy: "2026-12-31",
    permissionNote: PERMISSION_TODO,
  },
  {
    id: "grounded",
    name: "Grounded",
    legalName: "Grounded Peptides",
    href: "https://groundedpeptides.com",
    logoSrc: "/grounded-logo.svg",
    logoAlt: "Grounded",
    permission: "approved",
    permissionReviewBy: "2026-12-31",
    permissionNote: PERMISSION_TODO,
  },
  {
    id: "onyx",
    name: "ONYX Futures",
    href: "https://onyx-futures.com",
    logoSrc: "/onyx-logo.svg",
    logoAlt: "ONYX Futures",
    permission: "approved",
    permissionReviewBy: "2026-12-31",
    permissionNote: PERMISSION_TODO,
  },
  {
    id: "edgeable",
    name: "Edgeable",
    href: "https://edgeable.app",
    logoSrc: "/edgeable-logo.png",
    logoAlt: "Edgeable",
    permission: "approved",
    permissionReviewBy: "2026-12-31",
    permissionNote: PERMISSION_TODO,
  },
];

export function featuredPartnersInOrder(
  partners: readonly FeaturedPartner[] = FEATURED_PARTNERS
): FeaturedPartner[] {
  return [...partners].sort((a, b) => Number(b.lead === true) - Number(a.lead === true));
}

/** Partners the public site may show. Pending and revoked marks stay in config only. */
export function publicFeaturedPartners(
  partners: readonly FeaturedPartner[] = FEATURED_PARTNERS
): FeaturedPartner[] {
  return featuredPartnersInOrder(partners.filter((partner) => partner.permission === "approved"));
}

/**
 * How many times to repeat the list inside one marquee half.
 * Enough copies that the half is wider than a desktop viewport, so the loop has no gap.
 */
export function partnerMarqueeRepeat(count: number): number {
  if (count <= 0) return 0;
  return Math.max(4, Math.ceil(12 / count));
}
