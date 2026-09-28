import type { FeaturedPartner } from "@/lib/featuredPartners";

/** Partner mark, shown as supplied. No glow, plate, or filter on the artwork. */
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
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={partner.logoSrc} alt={alt} width={width} height={height} className={className} />
  );
}
