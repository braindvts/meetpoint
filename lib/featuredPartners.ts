export interface FeaturedPartner {
  id: string;
  name: string;
  href: string;
  /** Public path of the approved mark. */
  logoSrc: string;
  logoAlt: string;
  /** Shown first and larger. */
  lead?: boolean;
  /**
   * Black artwork that should be inverted on the ink field.
   * Marks drawn for a dark ground — Grounded's white tile — stay as authored.
   */
  invertOnInk?: boolean;
}

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
  },
  {
    id: "grounded",
    name: "Grounded",
    href: "https://groundedpeptides.com",
    logoSrc: "/grounded-logo.svg",
    logoAlt: "Grounded",
  },
  {
    id: "onyx",
    name: "ONYX Futures",
    href: "https://onyx-futures.com",
    logoSrc: "/onyx-logo.svg",
    logoAlt: "ONYX Futures",
  },
];

export function featuredPartnersInOrder(
  partners: readonly FeaturedPartner[] = FEATURED_PARTNERS
): FeaturedPartner[] {
  return [...partners].sort((a, b) => Number(b.lead === true) - Number(a.lead === true));
}

/** Even stations on the revolving ring. Lead stays at 0° when the list is ordered. */
export function partnerOrbitAngle(index: number, count: number): number {
  if (count <= 1) return 0;
  return (360 / count) * index;
}
