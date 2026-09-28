import assert from "node:assert/strict";
import { test } from "node:test";
import type { Member } from "@prisma/client";
import { memberToPerson } from "./memberMap.ts";

test("another member never receives email or phone", () => {
  const row = {
    id: "cm1",
    name: "Ada Lovelace",
    jobTitle: "Founder",
    company: "Analytical",
    industry: "Technology",
    bio: "Building.",
    photo: "",
    cityName: "London",
    cityCountry: "UK",
    cityLat: 51.5,
    cityLng: -0.12,
    travel: "worldwide",
    meetPreference: "open",
    lookingForJson: "[]",
    ideaTagsJson: JSON.stringify(["SaaS", "my custom free text"]),
    verificationsJson: "[]",
    workJson: "[]",
    email: "ada@secret.com",
    phone: "+15550001111",
    passwordHash: "nope",
    isSample: false,
    sampleKind: "",
    interests: [{ slug: "saas" }],
  } as unknown as Member & { interests: { slug: string }[] };

  const person = memberToPerson(row);
  assert.equal("email" in person, false);
  assert.equal("phone" in person, false);
  assert.equal("passwordHash" in person, false);
  assert.deepEqual(person.ideaTags, ["SaaS", "my custom free text"]);
  assert.equal(person.company, "Analytical");
  assert.equal(person.industry, "Technology");
  assert.equal("linkedInUrl" in person, false);
  assert.equal("websiteUrl" in person, false);
  assert.equal("portfolioUrl" in person, false);
  assert.deepEqual(person.verifications, []);
});
