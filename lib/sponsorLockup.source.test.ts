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
