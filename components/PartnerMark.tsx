import type { FeaturedPartner } from "@/lib/featuredPartners";

/**
 * Partner mark. Edgeable keeps the official speed-bar artwork untouched
 * and only adds a drop-shadow glow plus a hover sweep in the marquee.
 */
export default function PartnerMark({
  partner,
  className,
  width,
  height,
  alt,
}: {
  partner: Pick<FeaturedPartner, "id" | "logoSrc">;
  className: string;
  width: number;
  height: number;
  alt: string;
}) {
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={partner.logoSrc} alt={alt} width={width} height={height} className={className} />
  );
  if (partner.id !== "edgeable") return img;
  return (
    <span className="mp-edgeable-glow">
      <span className="mp-edgeable-clip">
        {img}
        <span className="mp-edgeable-sheen" aria-hidden />
      </span>
    </span>
  );
}
