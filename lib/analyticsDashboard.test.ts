import assert from "node:assert/strict";
import { test } from "node:test";
import { rangeStart, seededMemberWhere, seriesFromDates, standingFromMember } from "./analyticsDashboard.ts";
import { isSampleAccount, sampleMemberWhere } from "./sampleAccounts.ts";

test("standing follows Member, Verified, and BLACK storage", () => {
  assert.equal(standingFromMember({ black: false, verificationsJson: "[]" }), "Member");
  assert.equal(
    standingFromMember({
      black: false,
      verificationsJson: JSON.stringify([
        { method: "company-email", value: "a@co.test" },
        { method: "linkedin", value: "https://linkedin.com/in/a" },
      ]),
    }),
    "Verified"
  );
  assert.equal(
    standingFromMember({
      black: false,
      verificationsJson: JSON.stringify([{ method: "linkedin", value: "https://linkedin.com/in/a" }]),
    }),
    "Member"
  );
  assert.equal(
    standingFromMember({
      black: true,
      verificationsJson: JSON.stringify([
        { method: "company-email", value: "a@co.test" },
        { method: "linkedin", value: "https://linkedin.com/in/a" },
      ]),
    }),
    "BLACK"
  );
});

test("date series keeps a full window including empty days", () => {
  const now = new Date("2026-09-28T18:00:00.000Z");
  const series = seriesFromDates([new Date("2026-09-28T12:00:00.000Z")], "7d", now);
  assert.equal(series.length, 7);
  assert.equal(series[series.length - 1]?.count, 1);
  assert.equal(series[0]?.count, 0);
});

test("evening Eastern Time activity stays on that calendar day", () => {
  const now = new Date("2026-09-29T02:30:00.000Z");
  const evening = new Date("2026-09-29T01:00:00.000Z");
  const series = seriesFromDates([evening], "7d", now);
  assert.equal(series.length, 7);
  assert.equal(series[series.length - 1]?.label, "Sep 28");
  assert.equal(series[series.length - 1]?.count, 1);
  assert.equal(series[series.length - 2]?.label, "Sep 27");
  assert.equal(series[series.length - 2]?.count, 0);
  assert.equal(rangeStart("7d", now)?.toISOString(), "2026-09-22T04:00:00.000Z");
});

test("a UTC morning that is still the previous evening in ET is not today", () => {
  const now = new Date("2026-09-28T15:00:00.000Z");
  const previousEvening = new Date("2026-09-28T03:30:00.000Z");
  const series = seriesFromDates([previousEvening], "7d", now);
  assert.equal(series[series.length - 1]?.label, "Sep 28");
  assert.equal(series[series.length - 1]?.count, 0);
  assert.equal(series[series.length - 2]?.label, "Sep 27");
  assert.equal(series[series.length - 2]?.count, 1);
});

test("sample accounts are excluded with the shared isSample filter", () => {
  assert.deepEqual(seededMemberWhere(), sampleMemberWhere());
  const where = JSON.stringify(seededMemberWhere());
  assert.match(where, /isSample/);
  assert.match(where, /sampleKind/);
  assert.equal(isSampleAccount({ id: "real-1", isSample: true }), true);
  assert.equal(isSampleAccount({ id: "p1" }), true);
  assert.equal(isSampleAccount({ id: "real-2", email: "demo@conclave.app" }), true);
  assert.equal(isSampleAccount({ id: "real-3", sampleKind: "bot" }), true);
  assert.equal(isSampleAccount({ id: "real-4", email: "member@company.test" }), false);
});
