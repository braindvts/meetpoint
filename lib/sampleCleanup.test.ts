import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  cleanupBlockedByEnvironment,
  formatCleanupPlan,
  type CleanupPlan,
} from "./sampleCleanup.ts";

const plan: CleanupPlan = {
  accounts: [
    {
      id: "p1",
      name: "Marcus",
      email: "marcus@conclave.app",
      kind: "seed",
      markers: ["id:p1-p18"],
    },
  ],
  remove: {
    members: 1,
    eventRsvps: 2,
    eventIds: ["evt-black-tie-ny"],
    connections: 1,
    emptyChats: 0,
    sampleMessages: 3,
    blocks: 0,
    blackInvites: 0,
    blackConnections: 0,
    interests: 2,
    analytics: 0,
    reportsFiledBySamples: 0,
  },
  keep: {
    realMemberRsvps: 4,
    chatsSharedWithRealMembers: 1,
    reportsAboutSamples: 1,
  },
};

test("cleanup refuses CI, Vercel, and the build lifecycle", () => {
  assert.equal(cleanupBlockedByEnvironment({}), null);
  assert.equal(cleanupBlockedByEnvironment({ CI: "true" }), "CI");
  assert.equal(cleanupBlockedByEnvironment({ VERCEL: "1" }), "a Vercel deploy");
  assert.equal(cleanupBlockedByEnvironment({ npm_lifecycle_event: "build" }), "npm build");
  assert.equal(cleanupBlockedByEnvironment({ npm_lifecycle_event: "samples:cleanup" }), null);
});

test("dry-run summary names accounts and what stays", () => {
  const text = formatCleanupPlan(plan, false);
  assert.match(text, /Dry run\. Nothing was deleted/);
  assert.match(text, /preview and production use different databases and a backup exists/);
  assert.match(text, /owner confirms a database backup/);
  assert.match(text, /teammate has reviewed this output on a preview/);
  assert.match(text, /p1  Marcus  marcus@conclave.app  kind=seed  matched=id:p1-p18/);
  assert.match(text, /2 EventInterest RSVPs/);
  assert.match(text, /evt-black-tie-ny/);
  assert.match(text, /4 EventInterest RSVPs filed by real members/);
  assert.match(text, /Would reassign:\n- nothing/);
  assert.doesNotMatch(text, /Applying sample cleanup/);
  const applying = formatCleanupPlan(plan, true);
  assert.match(applying, /Applying sample cleanup/);
  assert.match(applying, /preview and production use different databases and a backup exists/);
});

test("build and deploy do not invoke the cleanup script", () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
    scripts: Record<string, string>;
  };
  const vercel = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8")) as {
    buildCommand?: string;
  };
  for (const key of ["build", "start", "postinstall", "db:deploy"]) {
    assert.doesNotMatch(
      pkg.scripts[key] || "",
      /cleanup-sample-accounts|samples:cleanup|backfill-member-interests/
    );
  }
  assert.doesNotMatch(vercel.buildCommand || "", /cleanup-sample-accounts|samples:cleanup/);
  assert.equal(pkg.scripts["samples:cleanup"], "tsx scripts/cleanup-sample-accounts.ts");
  const script = readFileSync(new URL("../scripts/cleanup-sample-accounts.ts", import.meta.url), "utf8");
  assert.match(script, /cleanupBlockedByEnvironment/);
  assert.match(script, /preview and production use different databases and a backup exists/);
  assert.doesNotMatch(script, /argv\.includes\("--apply"\)[\s\S]{0,80}true/);
});
