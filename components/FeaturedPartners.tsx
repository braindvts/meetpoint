"use client";

import { featuredPartnersInOrder, type FeaturedPartner } from "@/lib/featuredPartners";
import type { CSSProperties } from "react";

interface Props {
  /** True once the splash has reached the partner beat. */
  revealed: boolean;
}

/**
 * Featured-partner credit on the loading seal.
 * Logo and name sit open on the ink. The list is data-driven; BijuuFlow leads.
 */
export default function FeaturedPartners({ revealed }: Props) {
  const partners = featuredPartnersInOrder();
  if (partners.length === 0) return null;

  return (
    <section
      className={`mp-splash-partners ${revealed ? "mp-splash-partners--in" : ""}`}
      aria-label="Featured partners"
    >
      <span className="mp-featured-partners-rule" aria-hidden />
      <p className="mp-featured-partners-kicker" aria-hidden>
        Featured partners
      </p>
      <ul className="mp-featured-partners-list">
        {partners.map((partner, index) => (
          <PartnerCredit key={partner.id} partner={partner} index={index} />
        ))}
      </ul>
    </section>
  );
}

function PartnerCredit({ partner, index }: { partner: FeaturedPartner; index: number }) {
  const delay = `${index * 120}ms`;
  const style = {
    animationDelay: delay,
    "--mp-partner-delay": delay,
  } as CSSProperties;

  return (
    <li
      className={`mp-featured-partner${partner.lead ? " mp-featured-partner--lead" : ""}`}
      style={style}
    >
      <a
        href={partner.href}
        target="_blank"
        rel="noopener noreferrer"
        className="mp-featured-partner-link"
        aria-label={`${partner.name} (opens in a new tab)`}
        onClick={(event) => event.stopPropagation()}
      >
        <span className="mp-featured-partner-mark-wrap">
          <img
            src={partner.logoSrc}
            alt={partner.logoAlt}
            width={partner.lead ? 38 : 28}
            height={partner.lead ? 37 : 27}
            className="mp-featured-partner-mark"
          />
        </span>
        <span className="mp-featured-partner-name">{partner.name}</span>
      </a>
    </li>
  );
}
