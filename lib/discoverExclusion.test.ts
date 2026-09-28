import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  AUTO_HIDE_MIN_ACCOUNT_AGE_MS,
  autoHiddenFromRows,
  reporterCountsTowardAutoHide,
  shouldAutoHide,
  visibleInDiscover,
} from "./safetyRules.ts";

test("three distinct open reporters auto-hide a member", () => {
  const rows = [
    { peerId: "ada", reporterId: "a" },
    { peerId: "ada", reporterId: "b" },
    { peerId: "ada", reporterId: "b" },
    { peerId: "ada", reporterId: "c" },
    { peerId: "grace", reporterId: "a" },
    { peerId: "grace", reporterId: "b" },
  ];
  const hidden = autoHiddenFromRows(rows);
  assert.equal(shouldAutoHide(3), true);
  assert.equal(shouldAutoHide(2), false);
  assert.equal(hidden.has("ada"), true);
  assert.equal(hidden.has("grace"), false);
});

test("discover visibility drops the viewer, blocks, and auto-hidden members", () => {
  const visible = visibleInDiscover(
    ["me", "ada", "grace", "blocked"],
    "me",
    new Set(["blocked"]),
    new Set(["ada"])
  );
  assert.deepEqual(visible, ["grace"]);
});

test("member matching reuses discoverExcludedIds and does not define Block or Report", () => {
  const discover = readFileSync(new URL("../app/api/discover/route.ts", import.meta.url), "utf8");
  const members = readFileSync(new URL("../app/api/members/route.ts", import.meta.url), "utf8");
  const moderation = readFileSync(new URL("./moderation.ts", import.meta.url), "utf8");
  const schema = readFileSync(new URL("../prisma/schema.prisma", import.meta.url), "utf8");
  for (const src of [discover, members]) {
    assert.match(src, /discoverExcludedIds/);
    assert.match(src, /sampleMemberWhere/);
    assert.doesNotMatch(src, /prisma\.block\.findMany/);
    assert.doesNotMatch(src, /prisma\.report\.groupBy/);
  }
  assert.match(moderation, /qualifyingReporterIds/);
  assert.match(moderation, /reporterCountsTowardAutoHide/);
  assert.match(moderation, /autoHiddenFromRows\(rows\.filter/);
  assert.equal((schema.match(/model Block \{/g) || []).length, 1);
  assert.equal((schema.match(/model Report \{/g) || []).length, 1);
  assert.equal((schema.match(/model RateLimitBucket \{/g) || []).length, 1);
});

test("brand-new accounts do not count toward auto-hide", () => {
  const now = Date.parse("2026-09-28T00:00:00.000Z");
  const fresh = { createdAt: new Date(now - 60_000), name: "New", photo: "", jobTitle: "" };
  assert.equal(reporterCountsTowardAutoHide(fresh, now), false);
  assert.equal(
    reporterCountsTowardAutoHide({ ...fresh, emailVerifiedAt: "2026-09-01T00:00:00.000Z" }, now),
    true
  );
  assert.equal(
    reporterCountsTowardAutoHide(
      {
        ...fresh,
        name: "Ada",
        photo: "https://cdn.example/ada.jpg",
        jobTitle: "Founder",
        lookingFor: ["Co-founder"],
        ideaTags: ["SaaS"],
      },
      now
    ),
    true
  );
  assert.equal(
    reporterCountsTowardAutoHide(
      { ...fresh, createdAt: new Date(now - AUTO_HIDE_MIN_ACCOUNT_AGE_MS) },
      now
    ),
    true
  );
});

test("LinkedIn email lookup does not link or merge accounts", () => {
  const callback = readFileSync(
    new URL("../app/api/auth/linkedin/callback/route.ts", import.meta.url),
    "utf8"
  );
  const auth = readFileSync(new URL("./memberAuth.ts", import.meta.url), "utf8");
  const me = readFileSync(new URL("../app/api/members/me/route.ts", import.meta.url), "utf8");
  assert.match(callback, /postAuthPath/);
  assert.match(callback, /where: \{ email \}/);
  assert.doesNotMatch(callback, /prisma\.member\.(update|create|upsert)/);
  assert.match(auth, /return prisma\.member\.findFirst\(\{ where: \{ linkedInId: session\.id \} \}\)/);
  assert.match(me, /existing\.linkedInId === session\.id/);
  assert.match(me, /if \(taken\) createEmail = null/);
});
