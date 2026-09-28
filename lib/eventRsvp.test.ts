import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { applyRsvpCounts, catalogEvent, foldInterestCounts } from "./eventRsvp.ts";
import { getPublishedEvents } from "./events.ts";

test("RSVP counts treat going as attending and saved as interested", () => {
  const counts = foldInterestCounts([
    { eventId: "evt-black-tie-ny", status: "going", n: 2 },
    { eventId: "evt-black-tie-ny", status: "interested", n: 3 },
    { eventId: "evt-black-tie-ny", status: "saved", n: 1 },
    { eventId: "evt-black-tie-ny", status: "passed", n: 4 },
    { eventId: "evt-ai-summit-sf", status: "going", n: 1 },
  ]);
  assert.deepEqual(counts["evt-black-tie-ny"], { interested: 4, attending: 2 });
  assert.deepEqual(counts["evt-ai-summit-sf"], { interested: 0, attending: 1 });

  const [event] = applyRsvpCounts(getPublishedEvents().slice(0, 1), {});
  assert.equal(event?.interestedCount, 0);
  assert.equal(event?.attendeeCount, 0);
});

test("catalog lookup accepts an event id", () => {
  assert.equal(catalogEvent("evt-black-tie-ny")?.slug, "founders-table-midtown");
  assert.equal(catalogEvent("not-an-event"), undefined);
});

test("EventInterest baseline migration does not drop existing rows", () => {
  const sql = readFileSync(
    new URL("../prisma/migrations/20260928180000_event_interest_baseline/migration.sql", import.meta.url),
    "utf8"
  );
  assert.match(sql, /CREATE TABLE IF NOT EXISTS "EventInterest"/);
  assert.match(sql, /"memberId" TEXT NOT NULL/);
  assert.match(sql, /"eventId" TEXT NOT NULL/);
  assert.match(sql, /"status" TEXT NOT NULL/);
  assert.match(sql, /"createdAt" TIMESTAMP\(3\)/);
  assert.match(sql, /"updatedAt" TIMESTAMP\(3\)/);
  assert.doesNotMatch(sql, /^\s*DROP\b/im);
  assert.doesNotMatch(sql, /^\s*DELETE\b/im);
  const schema = readFileSync(new URL("../prisma/schema.prisma", import.meta.url), "utf8");
  assert.match(schema, /model EventInterest \{/);
});
