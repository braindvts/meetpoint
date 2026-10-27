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
   * Black artwork that was inverted on a dark field.
   * Leave unset so the mark keeps its own colors.
   */
  invertOnInk?: boolean;
}

/**
 * Loading-screen credit. Append a partner to extend the line.
 * Order is lead first, then the list as written.
 * BijuuFlow leads and uses the same destination and mark as the landing lockup.
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
  {
    id: "edgeable",
    name: "Edgeable",
    href: "https://edgeable.app",
    logoSrc: "/edgeable-logo.png",
    logoAlt: "Edgeable",
  },
];

export function featuredPartnersInOrder(
  partners: readonly FeaturedPartner[] = FEATURED_PARTNERS
): FeaturedPartner[] {
  return [...partners].sort((a, b) => Number(b.lead === true) - Number(a.lead === true));
}

/**
 * How many times to repeat the list inside one marquee half.
 * Enough copies that the half is wider than a desktop viewport, so the loop has no gap.
 */
export function partnerMarqueeRepeat(count: number): number {
  if (count <= 0) return 0;
  // Two partners still need a half wider than a desktop viewport.
  return Math.max(8, Math.ceil(24 / count));
}
