import assert from "node:assert/strict";
import { test } from "node:test";
import { seriesFromDates, standingFromMember } from "./analyticsDashboard.ts";

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
