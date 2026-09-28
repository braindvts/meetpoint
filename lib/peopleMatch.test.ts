import assert from "node:assert/strict";
import { test } from "node:test";
import { rankPeople, sharedInterestReason } from "./peopleMatch.ts";
import type { MatchSubject } from "./peopleMatch.ts";

const me: MatchSubject = {
  id: "me",
  jobTitle: "Founder",
  industry: "Technology",
  lookingFor: ["Investor"],
  interests: ["SaaS", "AI / Machine Learning", "Fintech"],
  city: { name: "New York", country: "USA", lat: 40.71, lng: -74.0 },
};

test("shared interests outrank a same-city stranger", () => {
  const ranked = rankPeople(me, [
    {
      id: "near",
      jobTitle: "Chef",
      industry: "Hospitality",
      lookingFor: ["Clients"],
      interests: ["Food & Restaurants"],
      city: { name: "New York", country: "USA", lat: 40.72, lng: -73.99 },
    },
    {
      id: "fit",
      jobTitle: "Investor",
      industry: "Finance",
      lookingFor: ["Co-founder"],
      interests: ["SaaS", "AI / Machine Learning", "Fintech"],
      city: { name: "London", country: "UK", lat: 51.5, lng: -0.12 },
    },
  ]);
  assert.equal(ranked[0]?.person.id, "fit");
  assert.equal(ranked[1]?.person.id, "near");
  assert.match(ranked[1]?.reasons.join(" ") || "", /Same city: New York/);
  assert.match(ranked[0]?.reasons[0] || "", /^3 shared interests: /);
  assert.match(ranked[0]?.reasons.join(" "), /Complementary intent: Investor ↔ Co-founder/);
});

test("sample-sized reason names the interests", () => {
  assert.equal(
    sharedInterestReason(["SaaS", "AI / Machine Learning", "Fintech"]),
    "3 shared interests: SaaS, AI / Machine Learning, Fintech"
  );
});

test("someone with nothing in common still appears as recently joined", () => {
  const ranked = rankPeople(me, [
    {
      id: "none",
      jobTitle: "Chef",
      industry: "Hospitality",
      lookingFor: ["Clients"],
      interests: ["Food & Restaurants"],
      city: { name: "Lagos", country: "Nigeria", lat: 6.5, lng: 3.4 },
      updatedAt: "2026-09-01T00:00:00.000Z",
    },
    {
      id: "newer",
      jobTitle: "Driver",
      industry: "Logistics",
      lookingFor: ["Hiring"],
      interests: ["Trucking & Logistics"],
      city: { name: "Lagos", country: "Nigeria", lat: 6.5, lng: 3.4 },
      updatedAt: "2026-09-20T00:00:00.000Z",
    },
  ]);
  assert.deepEqual(
    ranked.map((row) => row.person.id),
    ["newer", "none"]
  );
  assert.equal(ranked[0]?.reasons[0], "Recently joined");
  assert.equal(ranked[0]?.sharedInterests.length, 0);
});
