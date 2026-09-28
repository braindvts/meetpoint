import Script from "next/script";

/** Optional Plausible when NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set. */
export default function PlausibleScript() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN?.trim();
  if (!domain) return null;
  const src =
    process.env.NEXT_PUBLIC_PLAUSIBLE_SRC?.trim() ||
    "https://plausible.io/js/script.exclusions.js";
  return (
    <Script
      defer
      data-domain={domain}
      data-exclude="/verify-email"
      src={src}
      strategy="afterInteractive"
    />
  );
}
