import type { MouseEvent } from "react";
import { partnerOrbitAngle, type FeaturedPartner } from "@/lib/featuredPartners";

interface Props {
  partners: readonly FeaturedPartner[];
  variant: "splash" | "lockup";
  onLinkClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
}

/**
 * Marks travel a tilted ring so the path reads as a champagne ellipse.
 * Faces counter-rotate and stay upright. Transform only — no layout shift.
 */
export default function PartnerRevolve({ partners, variant, onLinkClick }: Props) {
  const count = partners.length;
  if (count === 0) return null;

  return (
    <div className={`mp-revolve-motion mp-revolve-motion--${variant}`}>
      <div className="mp-revolve-stage">
        <div className="mp-revolve-tilt">
          <span className="mp-revolve-ellipse" aria-hidden />
          <div className="mp-revolve-ring">
            {partners.map((partner, index) => {
              const angle = partnerOrbitAngle(index, count);
              return (
                <div
                  key={partner.id}
                  className="mp-revolve-slot"
                  style={{
                    transform: `rotateY(${angle}deg) translateZ(var(--mp-revolve-z)) rotateY(${-angle}deg)`,
                  }}
                >
                  <div className="mp-revolve-hanger">
                    <a
                      href={partner.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`mp-revolve-face${partner.lead ? " mp-revolve-face--lead" : ""}`}
                      aria-label={`${partner.name} (opens in a new tab)`}
                      onClick={onLinkClick}
                    >
                      <img
                        src={partner.logoSrc}
                        alt=""
                        width={28}
                        height={28}
                        className={`mp-revolve-mark${
                          partner.invertOnInk ? " mp-revolve-mark--invert" : " mp-revolve-mark--native"
                        }`}
                      />
                      <FaceName name={partner.name} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function FaceName({ name }: { name: string }) {
  if (name === "ONYX Futures") {
    return (
      <span className="mp-revolve-name font-display">
        <span className="mp-partner-onyx">ONYX</span>
        <span className="mp-partner-onyx-sub">Futures</span>
      </span>
    );
  }
  return <span className="mp-revolve-name font-display">{name}</span>;
}
