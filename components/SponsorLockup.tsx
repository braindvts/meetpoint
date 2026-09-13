const BIJUUFLOW_HREF = "https://bijuuflow.com/terminal";

interface Props {
  className?: string;
}

/**
 * Compact BijuuFlow sponsor credit — never a replacement for the Interlink wordmark.
 */
export default function SponsorLockup({ className = "" }: Props) {
  return (
    <a
      href={BIJUUFLOW_HREF}
      target="_blank"
      rel="noopener noreferrer"
      className={`mp-sponsor-lockup mp-press ${className}`.trim()}
      aria-label="Supported by BijuuFlow (opens in a new tab)"
    >
      <span className="mp-sponsor-lockup-kicker">Supported by</span>
      <img
        src="/bijuuflow-logo.svg"
        alt="BijuuFlow"
        width={28}
        height={27}
        className="mp-sponsor-lockup-mark"
      />
      <span className="mp-sponsor-lockup-name">BijuuFlow</span>
    </a>
  );
}
