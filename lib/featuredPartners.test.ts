import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { FEATURED_PARTNERS, featuredPartnersInOrder, type FeaturedPartner } from "./featuredPartners";

const ROOT = join(import.meta.dirname, "..");

test("BijuuFlow is the lead featured partner and uses the landing mark", () => {
  const ordered = featuredPartnersInOrder();
  assert.equal(ordered[0]?.id, "bijuuflow");
  assert.equal(ordered[0]?.name, "BijuuFlow");
  assert.equal(ordered[0]?.lead, true);
  assert.equal(ordered[0]?.href, "https://bijuuflow.com/terminal");
  assert.equal(ordered[0]?.logoSrc, "/bijuuflow-logo.svg");
  assert.equal(ordered[0]?.logoAlt, "BijuuFlow");
  assert.equal(FEATURED_PARTNERS.filter((partner) => partner.lead).length, 1);
  assert.equal(ordered.filter((partner) => partner.name === "BijuuFlow").length, 1);
});

test("later partners follow the lead without a layout rewrite", () => {
  const partners: FeaturedPartner[] = [
    { id: "second", name: "Second", href: "https://example.com/second", logoSrc: "/second.svg", logoAlt: "Second" },
    {
      id: "bijuuflow",
      name: "BijuuFlow",
      href: "https://bijuuflow.com/terminal",
      logoSrc: "/bijuuflow-logo.svg",
      logoAlt: "BijuuFlow",
      lead: true,
    },
    { id: "third", name: "Third", href: "https://example.com/third", logoSrc: "/third.svg", logoAlt: "Third" },
  ];
  assert.deepEqual(
    featuredPartnersInOrder(partners).map((partner) => partner.id),
    ["bijuuflow", "second", "third"]
  );
});

test("splash shows featured partners on a short minimal loader", () => {
  const splash = readFileSync(join(ROOT, "components/SplashScreen.tsx"), "utf8");
  const plate = readFileSync(join(ROOT, "components/FeaturedPartners.tsx"), "utf8");
  const css = readFileSync(join(ROOT, "app/globals.css"), "utf8");
  const lockup = readFileSync(join(ROOT, "components/SponsorLockup.tsx"), "utf8");

  assert.match(splash, /FEATURED_PARTNERS|FeaturedPartners/);
  assert.match(splash, /const FINAL_HOLD_MS = 2200/);
  assert.match(splash, /const PARTNERS_AT = START_MS \+ 4 \* LETTER_MS/);
  assert.match(splash, /setPartners\(true\)/);
  assert.match(splash, /INTERLINK/);
  assert.match(splash, /mp-splash-geom/);
  assert.match(splash, /onClick/);
  assert.doesNotMatch(splash, /Conclave/);
  assert.doesNotMatch(splash, /Linking in|mp-splash-bar|mp-splash-snap/);
  assert.doesNotMatch(plate, /Conclave/);

  assert.match(plate, /Featured partners/);
  assert.match(plate, /featuredPartnersInOrder/);
  assert.match(plate, /bijuuflow-logo\.svg|partner\.logoSrc/);
  assert.match(plate, /opens in a new tab/);

  assert.match(css, /mp-splash-partners--in/);
  assert.match(css, /splashDraw/);
  assert.match(css, /splashGeomPulse/);
  assert.match(css, /splashPartnerMark/);
  assert.doesNotMatch(css, /splashPartnerFlash|splashPartnerSheen/);
  assert.match(css, /#d4c4a8/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /\.mp-featured-partner-mark/);
  assert.match(plate, /mp-featured-partner-link/);
  assert.doesNotMatch(plate, /mp-featured-partner-plate|mp-press/);
  assert.doesNotMatch(css, /mp-featured-partner-plate/);
  const markStart = css.indexOf("@keyframes splashPartnerMark");
  const mark = css.slice(markStart, css.indexOf("}", css.indexOf("}", markStart) + 1) + 1);
  assert.doesNotMatch(mark, /inset|border|scale\(/);
  assert.match(css, /\.mp-featured-partner-link \{[\s\S]*?border:\s*0;/);
  assert.match(css, /stroke-dashoffset:\s*0/);

  assert.match(lockup, /Supported by/);
  assert.match(lockup, /https:\/\/bijuuflow\.com\/terminal/);
  assert.match(lockup, /bijuuflow-logo\.svg/);
  assert.doesNotMatch(lockup, /Featured partners/);
});
