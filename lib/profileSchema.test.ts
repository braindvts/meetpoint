import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { profileUpdateSchema } from "./validation/profile.ts";

test("profile save keeps canonical interests and custom tags", () => {
  const parsed = profileUpdateSchema.parse({
    name: "Ada Lovelace",
    jobTitle: "Founder",
    company: "Analytical Engines",
    industry: "Technology",
    bio: "Building.",
    photo: "https://example.com/ada.jpg",
    city: { name: "London", country: "UK", lat: 51.5, lng: -0.12 },
    travel: "worldwide",
    lookingFor: ["Investor"],
    ideaTags: ["SaaS", "  not a real tag  ", "SaaS"],
  });
  assert.deepEqual(parsed.ideaTags, ["SaaS", "not a real tag"]);
  assert.equal(
    profileUpdateSchema.safeParse({
      name: "Ada Lovelace",
      jobTitle: "Founder",
      bio: "",
      photo: "",
      city: { name: "London", country: "UK", lat: 51.5, lng: -0.12 },
      travel: "worldwide",
      lookingFor: ["Investor"],
      ideaTags: ["https://spam.test/offer"],
    }).success,
    false
  );
  assert.equal(parsed.industry, "Technology");
  assert.equal(parsed.company, "Analytical Engines");
});

test("unknown industry is rejected", () => {
  const parsed = profileUpdateSchema.safeParse({
    name: "Ada",
    jobTitle: "Founder",
    industry: "Pyramid schemes",
    bio: "",
    photo: "",
    city: { name: "London", country: "UK", lat: 51.5, lng: -0.12 },
    travel: "worldwide",
    lookingFor: ["Investor"],
    ideaTags: ["SaaS"],
  });
  assert.equal(parsed.success, false);
});

test("sample exclusion guards nullable columns so real members are not dropped", () => {
  const src = readFileSync(new URL("./sampleAccounts.ts", import.meta.url), "utf8");
  assert.match(src, /linkedInId:\s*\{\s*not:\s*null\s*\}/);
  assert.match(src, /email:\s*\{\s*not:\s*null\s*\}/);
});
