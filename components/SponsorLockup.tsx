import { featuredPartnersInOrder } from "@/lib/featuredPartners";
import PartnerRevolve from "@/components/PartnerRevolve";

interface Props {
  className?: string;
}

/**
 * Compact sponsor credit — never a replacement for the Interlink wordmark.
 * BijuuFlow leads; later partners follow, each with its own link.
 */
function PartnerName({ name }: { name: string }) {
  if (name === "ONYX Futures") {
    return (
      <span className="mp-sponsor-lockup-name font-display">
        <span className="mp-partner-onyx">ONYX</span>
        <span className="mp-partner-onyx-sub">Futures</span>
      </span>
    );
  }
  return <span className="mp-sponsor-lockup-name font-display">{name}</span>;
}

export default function SponsorLockup({ className = "" }: Props) {
  const partners = featuredPartnersInOrder();

  return (
    <div className={`mp-sponsor-lockup ${className}`.trim()}>
      <span className="mp-sponsor-lockup-kicker">Supported by</span>
      <PartnerRevolve partners={partners} variant="lockup" />
      <p className="mp-sponsor-lockup-row mp-revolve-static">
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
            className="mp-sponsor-lockup-link mp-press"
            aria-label={`${partner.name} (opens in a new tab)`}
          >
            <img
              src={partner.logoSrc}
              alt={partner.logoAlt}
              width={28}
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
