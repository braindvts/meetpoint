"use client";

import PartnerMark from "@/components/PartnerMark";
import { trackPartnerClick } from "@/lib/analytics";

/**
 * Compact featured-partner credit beside the landing marquee.
 * One line of Edgeable's boilerplate — not the full legal note.
 */
export default function EdgeableSpotlight({ className = "" }: { className?: string }) {
  return (
    <aside
      className={`mp-edgeable-spot mp-scroll-reveal ${className}`.trim()}
      aria-label="Featured partner"
    >
      <PartnerMark
        partner={{ id: "edgeable", logoSrc: "/edgeable-logo.png" }}
        className="mp-edgeable-spot-mark"
        width={72}
        height={52}
        alt=""
      />
      <div className="mp-edgeable-spot-copy">
        <p className="mp-edgeable-spot-kicker">Featured partner</p>
        <p className="mp-edgeable-spot-name font-display">Edgeable</p>
        <p className="mp-edgeable-spot-line">
          Cloud-first, multi-broker futures trade copier for prop-firm traders.
        </p>
        <a
          className="mp-edgeable-spot-link"
          href="https://edgeable.app"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackPartnerClick("edgeable", "featured")}
        >
          Visit Edgeable
        </a>
      </div>
    </aside>
  );
}
