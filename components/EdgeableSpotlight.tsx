import PartnerMark from "@/components/PartnerMark";
import { publicFeaturedPartners } from "@/lib/featuredPartners";

/**
 * Compact featured-partner credit beside the landing marquee.
 * One line of Edgeable's boilerplate — not the full legal note.
 * Hidden when Edgeable is not a public partner.
 */
export default function EdgeableSpotlight({ className = "" }: { className?: string }) {
  const partner = publicFeaturedPartners().find((item) => item.id === "edgeable");
  if (!partner) return null;

  return (
    <aside
      className={`mp-edgeable-spot mp-scroll-reveal ${className}`.trim()}
      aria-label="Featured partner"
    >
      <PartnerMark
        partner={partner}
        className="mp-edgeable-spot-mark"
        width={72}
        height={52}
        alt=""
      />
      <div className="mp-edgeable-spot-copy">
        <p className="mp-edgeable-spot-kicker">Featured partner</p>
        <p className="mp-edgeable-spot-name font-display">{partner.name}</p>
        <p className="mp-edgeable-spot-line">
          Cloud-first, multi-broker futures trade copier for prop-firm traders.
        </p>
        <a
          className="mp-edgeable-spot-link"
          href={partner.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          Visit Edgeable
        </a>
      </div>
    </aside>
  );
}
