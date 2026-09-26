import type { MouseEvent } from "react";
import { partnerMarqueeRepeat, type FeaturedPartner } from "@/lib/featuredPartners";

interface Props {
  partners: readonly FeaturedPartner[];
  variant: "splash" | "lockup";
  onLinkClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
}

/**
 * One horizontal row, scrolling left. The track is two identical halves,
 * so translateX(-50%) lands on the same arrangement and the loop does not jump.
 */
export default function PartnerMarquee({ partners, variant, onLinkClick }: Props) {
  const count = partners.length;
  if (count === 0) return null;
  const repeat = partnerMarqueeRepeat(count);

  return (
    <div className={`mp-marquee mp-marquee-motion mp-marquee--${variant}`}>
      <div className="mp-marquee-track">
        <MarqueeHalf partners={partners} repeat={repeat} duplicate={false} onLinkClick={onLinkClick} />
        <MarqueeHalf partners={partners} repeat={repeat} duplicate onLinkClick={onLinkClick} />
      </div>
    </div>
  );
}

function MarqueeHalf({
  partners,
  repeat,
  duplicate,
  onLinkClick,
}: {
  partners: readonly FeaturedPartner[];
  repeat: number;
  duplicate: boolean;
  onLinkClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  const items = Array.from({ length: repeat }, () => partners).flat();

  return (
    <div className="mp-marquee-set" aria-hidden={duplicate ? true : undefined}>
      {items.map((partner, index) => {
        const copy = duplicate || index >= partners.length;
        return (
          <a
            key={`${partner.id}-${index}`}
            href={partner.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`mp-marquee-link${partner.lead ? " mp-marquee-link--lead" : ""}`}
            aria-label={copy ? undefined : `${partner.name} (opens in a new tab)`}
            aria-hidden={copy ? true : undefined}
            tabIndex={copy ? -1 : undefined}
            onClick={onLinkClick}
          >
            <img
              src={partner.logoSrc}
              alt=""
              width={28}
              height={28}
              className={`mp-marquee-mark${
                partner.invertOnInk ? " mp-marquee-mark--invert" : " mp-marquee-mark--native"
              }`}
            />
            <MarqueeName name={partner.name} />
          </a>
        );
      })}
    </div>
  );
}

function MarqueeName({ name }: { name: string }) {
  if (name === "ONYX Futures") {
    return (
      <span className="mp-marquee-name font-display">
        <span className="mp-partner-onyx">ONYX</span>
        <span className="mp-partner-onyx-sub">Futures</span>
      </span>
    );
  }
  return <span className="mp-marquee-name font-display">{name}</span>;
}
