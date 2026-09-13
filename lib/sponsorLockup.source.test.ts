import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const ROOT = join(import.meta.dirname, "..");

test("landing credits BijuuFlow as a sponsor, not a replacement brand", () => {
  const page = readFileSync(join(ROOT, "app/page.tsx"), "utf8");
  const lockup = readFileSync(join(ROOT, "components/SponsorLockup.tsx"), "utf8");
  assert.match(page, /<SponsorLockup/);
  assert.match(page, /Interlink/);
  assert.doesNotMatch(page, /Conclave/);
  assert.match(lockup, /Supported by/);
  assert.match(lockup, /https:\/\/bijuuflow\.com\/terminal/);
  assert.match(lockup, /bijuuflow-logo\.svg/);
  assert.match(lockup, /aria-label="Supported by BijuuFlow/);
  assert.match(lockup, /alt="BijuuFlow"/);
  assert.doesNotMatch(lockup, /Conclave/);
});

test("BijuuFlow mark is committed under public/ as a compact SVG", () => {
  const svgPath = join(ROOT, "public/bijuuflow-logo.svg");
  assert.equal(existsSync(svgPath), true);
  const svg = readFileSync(svgPath, "utf8");
  assert.match(svg, /<svg/);
  assert.match(svg, /<path/);
  assert.ok(Buffer.byteLength(svg) < 100_000);
});
