import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { SITE_DESCRIPTION, SITE_ORIGIN, SITE_TITLE } from "./site";

const ROOT = join(import.meta.dirname, "..");

test("root metadata titles and describes Interlink for search and social", () => {
  assert.equal(SITE_TITLE, "Interlink | Professional Business Connections");
  assert.match(SITE_DESCRIPTION, /Interlink/);
  assert.match(SITE_DESCRIPTION, /private network/);
  assert.match(SITE_DESCRIPTION, /professional introductions/);
  assert.match(SITE_DESCRIPTION, /dinner-table/);
  assert.equal(SITE_ORIGIN, "https://interlinkgobal.com");

  const layout = readFileSync(join(ROOT, "app/layout.tsx"), "utf8");
  assert.match(layout, /SITE_TITLE/);
  assert.match(layout, /SITE_DESCRIPTION/);
  assert.match(layout, /metadataBase: new URL\(SITE_ORIGIN\)/);
  assert.match(layout, /openGraph/);
  assert.match(layout, /twitter/);
  assert.doesNotMatch(layout, /Conclave/);

  const page = readFileSync(join(ROOT, "app/page.tsx"), "utf8");
  assert.match(page, /alternates: \{ canonical: "\/" \}/);
});

test("homepage weaves Interlink through hero and key sections", () => {
  const page = readFileSync(join(ROOT, "app/page.tsx"), "utf8");
  assert.match(page, /private network for professional introductions/);
  assert.match(page, /Interlink makes the introduction/);
  assert.match(page, /Interlink shows who will be in the room/);
  assert.match(page, /on Interlink/);
  assert.match(page, /<SponsorLockup/);
  assert.match(page, /Enter Interlink/);
  assert.doesNotMatch(page, /Conclave/);
});

test("sitemap and robots point at the production origin", () => {
  const sitemap = readFileSync(join(ROOT, "app/sitemap.ts"), "utf8");
  const robots = readFileSync(join(ROOT, "app/robots.ts"), "utf8");
  assert.match(sitemap, /SITE_ORIGIN/);
  assert.match(sitemap, /\/events/);
  assert.match(sitemap, /\/login/);
  assert.match(robots, /sitemap: `\$\{SITE_ORIGIN\}\/sitemap\.xml`/);
  assert.match(robots, /\/admin/);
  assert.match(robots, /\/api\//);
  assert.equal(existsSync(join(ROOT, "public/robots.txt")), false);
});
