import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const ROOT = join(import.meta.dirname, "..");

/** User-facing copy. Comments in these files count too, so the source stays clean. */
const COPY_FILES = [
  "app/page.tsx",
  "app/not-found.tsx",
  "app/error.tsx",
  "app/events/page.tsx",
  "app/discover/page.tsx",
  "app/chats/page.tsx",
  "lib/site.ts",
  "lib/tiers.ts",
  "components/SplashScreen.tsx",
  "components/MembershipTiers.tsx",
  "components/PlansSection.tsx",
  "components/EdgeableSpotlight.tsx",
  "components/FeaturedPartners.tsx",
  "components/SponsorLockup.tsx",
  "components/EmptyState.tsx",
];

const EM = "\u2014";
const EN = "\u2013";

test("user-facing copy has no em dash, en dash, or spaced double hyphen", () => {
  for (const file of COPY_FILES) {
    const text = readFileSync(join(ROOT, file), "utf8");
    assert.equal(text.includes(EM), false, `${file} contains an em dash`);
    assert.equal(text.includes(EN), false, `${file} contains an en dash`);
    assert.equal(text.includes(" -- "), false, `${file} contains a spaced double hyphen`);
  }
});
