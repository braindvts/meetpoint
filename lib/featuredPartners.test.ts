import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import {
  FEATURED_PARTNERS,
  featuredPartnersInOrder,
  partnerMarqueeRepeat,
  type FeaturedPartner,
} from "./featuredPartners";

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

test("Grounded follows BijuuFlow and keeps its own mark and link", () => {
  const ordered = featuredPartnersInOrder();
  const grounded = ordered.find((partner) => partner.id === "grounded");
  assert.equal(ordered[0]?.id, "bijuuflow");
  assert.equal(ordered[1]?.id, "grounded");
  assert.equal(grounded?.name, "Grounded");
  assert.equal(grounded?.lead, undefined);
  assert.equal(grounded?.invertOnInk, undefined);
  assert.equal(grounded?.href, "https://groundedpeptides.com");
  assert.equal(grounded?.logoSrc, "/grounded-logo.svg");
  assert.equal(grounded?.logoAlt, "Grounded");
  assert.equal(ordered.filter((partner) => partner.name === "Grounded").length, 1);
});

test("ONYX Futures follows Grounded and keeps its own mark and link", () => {
  const ordered = featuredPartnersInOrder();
  const onyx = ordered.find((partner) => partner.id === "onyx");
  assert.deepEqual(
    ordered.map((partner) => partner.id),
    ["bijuuflow", "grounded", "onyx"]
  );
  assert.equal(onyx?.name, "ONYX Futures");
  assert.equal(onyx?.lead, undefined);
  assert.equal(onyx?.invertOnInk, undefined);
  assert.equal(onyx?.href, "https://onyx-futures.com");
  assert.equal(onyx?.logoSrc, "/onyx-logo.svg");
  assert.equal(onyx?.logoAlt, "ONYX Futures");
  assert.equal(ordered.filter((partner) => partner.name === "ONYX Futures").length, 1);
});

test("marquee repeats the list enough to loop without a gap", () => {
  assert.equal(partnerMarqueeRepeat(0), 0);
  assert.equal(partnerMarqueeRepeat(3), 4);
  assert.ok(partnerMarqueeRepeat(1) >= 4);
  assert.ok(partnerMarqueeRepeat(6) >= 4);
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
  assert.match(splash, /const FINAL_HOLD_MS = 3000/);
  assert.match(splash, /const PARTNERS_AT = START_MS \+ LETTERS\.length \* LETTER_MS \+ 180/);
  assert.match(splash, /setPartners\(true\)/);
  assert.match(splash, /INTERLINK/);
  assert.match(splash, /mp-splash-geom/);
  assert.match(splash, /onClick/);
  assert.doesNotMatch(splash, /Conclave/);
  assert.doesNotMatch(splash, /Linking in|mp-splash-bar|mp-splash-snap/);
  assert.doesNotMatch(plate, /Conclave/);

  assert.match(plate, /Supported by our partners/);
  assert.doesNotMatch(plate, /PartnerMarquee|mp-marquee/);
  assert.match(plate, /featuredPartnersInOrder/);
  assert.match(plate, /bijuuflow-logo\.svg|partner\.logoSrc/);
  assert.match(plate, /opens in a new tab/);
  assert.match(plate, /stopPropagation/);
  assert.match(plate, /target="_blank"/);
  assert.match(plate, /noopener noreferrer/);
  assert.match(plate, /mp-partner-onyx/);
  assert.match(plate, /ONYX Futures/);

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
  assert.match(css, /\.mp-featured-partner-link \{[\s\S]*?white-space:\s*nowrap;/);
  assert.match(css, /\.mp-partner-onyx-sub/);
  assert.match(css, /stroke-dashoffset:\s*0/);

  assert.match(lockup, /Supported by/);
  assert.match(lockup, /featuredPartnersInOrder/);
  assert.match(lockup, /target="_blank"/);
  assert.match(lockup, /noopener noreferrer/);
  assert.match(lockup, /partner\.href/);
  assert.match(lockup, /partner\.logoSrc/);
  assert.doesNotMatch(lockup, /Featured partners/);
  assert.match(css, /mp-sponsor-lockup-mark--native/);
  assert.match(css, /mp-featured-partner-mark--invert/);

  const marquee = readFileSync(join(ROOT, "components/PartnerMarquee.tsx"), "utf8");
  assert.match(marquee, /partnerMarqueeRepeat/);
  assert.match(marquee, /target="_blank"/);
  assert.match(marquee, /noopener noreferrer/);
  assert.match(marquee, /partner\.href/);
  assert.match(marquee, /partner\.logoSrc/);
  assert.match(marquee, /aria-hidden/);
  assert.match(marquee, /tabIndex=\{copy \? -1 : undefined\}/);
  assert.doesNotMatch(marquee, /ellipse|rotateY|translateZ/);
  assert.match(lockup, /PartnerMarquee/);
  assert.match(css, /@keyframes mpMarquee/);
  assert.match(css, /translateX\(-50%\)/);
  assert.match(css, /linear infinite/);
  assert.match(css, /mask-image/);
  assert.doesNotMatch(css, /\.mp-marquee:hover[\s\S]{0,200}animation-play-state:\s*paused/);
  assert.doesNotMatch(css, /\.mp-marquee:focus-within[\s\S]{0,200}animation-play-state:\s*paused/);
  assert.match(css, /@keyframes mpPartnerPop/);
  assert.match(css, /scale\(0\.94\)/);
  assert.match(css, /blur\(5px\)/);
  assert.match(css, /mpPartnerPop[\s\S]*var\(--ease-spring\)/);
  assert.match(css, /prefers-reduced-motion:\s*reduce[\s\S]*\.mp-marquee-static\s*\{[^}]*display:\s*flex/);
  assert.doesNotMatch(css, /mp-revolve-ellipse|mpRevolveSpin|rotateY\(360deg\)/);
  const slideStart = css.indexOf("@keyframes mpMarquee");
  const slide = css.slice(slideStart, css.indexOf("}", css.indexOf("}", slideStart) + 1) + 1);
  assert.match(slide, /translateX/);
  assert.doesNotMatch(slide, /width|height|left|top|margin|rotate/);
});
