import { featuredPartnersInOrder } from "@/lib/featuredPartners";
import PartnerMarquee from "@/components/PartnerMarquee";
import PartnerMark from "@/components/PartnerMark";

interface Props {
  className?: string;
}

/**
 * Compact sponsor credit. Never a replacement for the Interlink wordmark.
 * BijuuFlow leads; later partners follow, each with its own link.
 */
function PartnerName({ name }: { name: string }) {
  return <span className="mp-sponsor-lockup-name font-display">{name}</span>;
}

export default function SponsorLockup({ className = "" }: Props) {
  const partners = featuredPartnersInOrder();

  return (
    <div className={`mp-sponsor-lockup ${className}`.trim()}>
      <span className="mp-sponsor-lockup-kicker">With</span>
      <PartnerMarquee partners={partners} variant="lockup" />
      <p className="mp-sponsor-lockup-row mp-marquee-static">
      {partners.map((partner, index) => (
        <span key={partner.id} className="mp-sponsor-lockup-slot">
          {index > 0 ? (
            <span className="mp-sponsor-lockup-dot" aria-hidden>
              ·
            </span>
          ) : null}
          <a
            href={partner.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`mp-sponsor-lockup-link mp-press${
              partner.id === "edgeable" ? " mp-partner-edgeable" : ""
            }`}
            aria-label={`${partner.name} (opens in a new tab)`}
          >
            <PartnerMark
              partner={partner}
              alt={partner.logoAlt}
              width={partner.id === "edgeable" ? 48 : 28}
              height={28}
              className={`mp-sponsor-lockup-mark${partner.invertOnInk ? "" : " mp-sponsor-lockup-mark--native"}`}
            />
            <PartnerName name={partner.name} />
          </a>
        </span>
      ))}
      </p>
    </div>
  );
}
