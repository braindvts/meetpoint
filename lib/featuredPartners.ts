export interface FeaturedPartner {
  id: string;
  name: string;
  href: string;
  /** Public path of the approved mark. */
  logoSrc: string;
  logoAlt: string;
  /** Shown first, larger, and with the champagne flash. */
  lead?: boolean;
}

/**
 * Loading-screen credit. Append a partner to extend the line —
 * order is lead first, then the list as written.
 * BijuuFlow uses the same destination and mark as the landing lockup.
 */
export const FEATURED_PARTNERS: readonly FeaturedPartner[] = [
  {
    id: "bijuuflow",
    name: "BijuuFlow",
    href: "https://bijuuflow.com/terminal",
    logoSrc: "/bijuuflow-logo.svg",
    logoAlt: "BijuuFlow",
    lead: true,
  },
];

export function featuredPartnersInOrder(
  partners: readonly FeaturedPartner[] = FEATURED_PARTNERS
): FeaturedPartner[] {
  return [...partners].sort((a, b) => Number(b.lead === true) - Number(a.lead === true));
}
