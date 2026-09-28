import assert from "node:assert/strict";
import { test } from "node:test";
import { postAuthPath, safeAppPath } from "./appPath.ts";

test("keeps a same-site event path", () => {
  assert.equal(safeAppPath("/events/founders-table-midtown"), "/events/founders-table-midtown");
  assert.equal(
    postAuthPath({ requested: "/events/founders-table-midtown", hasIdentity: true }),
    "/events/founders-table-midtown"
  );
});

test("falls back to discover when the target is off-site", () => {
  const bad = [
    "https://evil.example/phish",
    "http://evil.example",
    "//evil.example",
    "/\\evil.example",
    "/%2f%2fevil.example",
    "/%5c%5cevil.example",
    "javascript:alert(1)",
    "/events/foo bar",
    "/%00/events",
    "https:evil.example",
    "/.//evil.com",
    "/foo/../evil.com",
    "/%2e%2f%2fevil.com",
    "/events/./secret",
  ];
  for (const value of bad) {
    assert.equal(safeAppPath(value), null, value);
    assert.equal(postAuthPath({ requested: value, hasIdentity: true }), "/discover", value);
  }
});

test("incomplete identity stays on onboarding", () => {
  assert.equal(
    postAuthPath({
      requested: "/events/founders-table-midtown",
      hasIdentity: false,
      incomplete: "/onboarding?google=1",
    }),
    "/onboarding?google=1"
  );
});
