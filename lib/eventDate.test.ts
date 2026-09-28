import assert from "node:assert/strict";
import { test } from "node:test";
import { formatCount, formatEventDate, formatEventTime } from "./events.ts";

test("event dates and counts do not follow the process locale", () => {
  assert.equal(formatEventDate("2026-10-03T19:00:00-04:00"), "Sat, Oct 3, 2026");
  assert.equal(formatEventTime("2026-10-03T19:00:00-04:00"), "7:00 PM");
  assert.equal(formatCount(12000), "12,000");
  assert.equal(formatCount(9), "9");
});
