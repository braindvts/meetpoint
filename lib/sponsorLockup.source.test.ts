import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const ROOT = join(import.meta.dirname, "..");

test("landing credits BijuuFlow as a sponsor, not a replacement brand", () => {
  const page = readFileSync(join(ROOT, "app/page.tsx"), "utf8");
  const lockup = readFileSync(join(ROOT, "components/SponsorLockup.tsx"), "utf8");
  const partners = readFileSync(join(ROOT, "lib/featuredPartners.ts"), "utf8");
  assert.match(page, /<SponsorLockup/);
  assert.match(page, /Interlink/);
  assert.doesNotMatch(page, /Conclave/);
  assert.match(lockup, /Supported by/);
  assert.match(lockup, /featuredPartnersInOrder/);
  assert.match(lockup, /target="_blank"/);
  assert.match(lockup, /noopener noreferrer/);
  assert.match(lockup, /alt=\{partner\.logoAlt\}/);
  assert.match(partners, /https:\/\/bijuuflow\.com\/terminal/);
  assert.match(partners, /bijuuflow-logo\.svg/);
  assert.match(partners, /name: "BijuuFlow"/);
  assert.match(partners, /https:\/\/groundedpeptides\.com/);
  assert.match(partners, /grounded-logo\.svg/);
  assert.match(partners, /name: "Grounded"/);
  assert.match(partners, /https:\/\/onyx-futures\.com/);
  assert.match(partners, /onyx-logo\.svg/);
  assert.match(partners, /name: "ONYX Futures"/);
  assert.match(partners, /https:\/\/edgeable\.app/);
  assert.match(partners, /edgeable-logo\.png/);
  assert.match(partners, /name: "Edgeable"/);
  assert.match(lockup, /mp-partner-onyx/);
  assert.match(lockup, /Futures/);
  assert.doesNotMatch(lockup, /Conclave/);
  assert.doesNotMatch(partners, /Conclave/);
});

test("BijuuFlow mark is committed under public/ as a compact SVG", () => {
  const svgPath = join(ROOT, "public/bijuuflow-logo.svg");
  assert.equal(existsSync(svgPath), true);
  const svg = readFileSync(svgPath, "utf8");
  assert.match(svg, /<svg/);
  assert.match(svg, /<path/);
  assert.ok(Buffer.byteLength(svg) < 100_000);
});

test("ONYX Futures mark is the gold eclipse, committed under public/", () => {
  const svgPath = join(ROOT, "public/onyx-logo.svg");
  assert.equal(existsSync(svgPath), true);
  const svg = readFileSync(svgPath, "utf8");
  assert.match(svg, /<svg/);
  assert.match(svg, /#E2B03D|#D49A1F/);
  assert.match(svg, /#0B0B0B/);
  assert.doesNotMatch(svg, /<rect/);
  assert.ok(Buffer.byteLength(svg) < 20_000);
});

test("Edgeable mark is the gold speed bars, committed under public/", () => {
  const pngPath = join(ROOT, "public/edgeable-logo.png");
  assert.equal(existsSync(pngPath), true);
  const png = readFileSync(pngPath);
  assert.ok(png.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])));
  assert.equal(png.subarray(12, 16).toString("ascii"), "IHDR");
  assert.equal(png[25], 6);
  assert.ok(png.byteLength < 80_000);
});

test("Grounded mark is the header tile, committed under public/", () => {
  const svgPath = join(ROOT, "public/grounded-logo.svg");
  assert.equal(existsSync(svgPath), true);
  const svg = readFileSync(svgPath, "utf8");
  assert.match(svg, /<svg/);
  assert.match(svg, /#FFFFFF/);
  assert.match(svg, /#06101F/);
  assert.match(svg, /#3B82F6/);
  assert.doesNotMatch(svg, /<rect[^>]*stroke/);
  assert.ok(Buffer.byteLength(svg) < 100_000);
});
