import assert from "node:assert/strict";
import { test } from "node:test";
import { DEMO_PEOPLE } from "./demoPeople.ts";
import {
  classifySample,
  isRandomUserPhotoHost,
  isSamplePortraitUrl,
  sampleMarkers,
  sampleMemberWhere,
} from "./sampleAccounts.ts";
import { profileUpdateSchema } from "./validation/profile.ts";

test("legacy seeds, the guest profile, and portrait bots are samples", () => {
  assert.equal(classifySample({ id: "p3" }), "seed");
  assert.equal(
    classifySample({
      id: "real-id",
      verificationsJson: JSON.stringify([{ value: "https://linkedin.com/in/conclave-demo" }]),
    }),
    "guest"
  );
  assert.equal(
    classifySample({ id: "guest", email: "demo@conclave.app" }),
    "guest"
  );
  assert.equal(
    classifySample({
      id: "bot",
      photo: "https://randomuser.me/api/portraits/men/32.jpg",
    }),
    "bot"
  );
});

test("a normal signup is not a sample", () => {
  assert.equal(
    classifySample({
      id: "cm123",
      email: "ada@company.com",
      photo: "https://images.unsplash.com/photo",
      verificationsJson: "[]",
      isSample: false,
      sampleKind: "",
    }),
    null
  );
  assert.equal(
    classifySample({
      id: "cm456",
      email: "ada@conclave.app",
      photo: "",
      verificationsJson: "[]",
      isSample: false,
      sampleKind: "",
    }),
    null
  );
});

test("a real member is not flagged by a photo that only mentions randomuser.me", () => {
  const real = {
    id: "cm_real_member",
    email: "ada@company.com",
    isSample: false as const,
    sampleKind: "",
  };
  const mentionsHost = [
    "https://cdn.example.com/u/randomuser.me.jpg",
    "https://images.example.com/photo.jpg?src=randomuser.me",
    "https://randomuser.me.evil.test/api/portraits/men/32.jpg",
    "https://not-randomuser.me/api/portraits/men/32.jpg",
    "https://example.com/redirect?url=https://randomuser.me/api/portraits/women/44.jpg",
    "https://randomuser.me/api/portraits/men/32.jpg.fake",
    "https://randomuser.me/api/portraits/lego/1.jpg",
    "https://randomuser.me/other.jpg",
    "https://www.randomuser.me/api/portraits/men/32.jpg",
    "http://randomuser.me/api/portraits/men/32.jpg",
    "https://randomuser.me/api/portraits/men/32.jpg?size=large",
    "https://randomuser.me/api/portraits/men/100.jpg",
  ];
  for (const photo of mentionsHost) {
    assert.equal(isSamplePortraitUrl(photo), false, photo);
    assert.equal(classifySample({ ...real, photo }), null, photo);
    assert.deepEqual(sampleMarkers({ ...real, photo }), [], photo);
  }

  for (const person of DEMO_PEOPLE) {
    assert.equal(isSamplePortraitUrl(person.photoUrl), true, person.id);
  }
  assert.equal(
    classifySample({
      ...real,
      id: "bot-row",
      photo: "https://randomuser.me/api/portraits/men/32.jpg",
    }),
    "bot"
  );
});

test("a real member cannot save a randomuser.me photo", () => {
  const base = {
    name: "Ada",
    jobTitle: "Founder",
    bio: "",
    city: { name: "London", country: "UK", lat: 51.5, lng: -0.12 },
    travel: "worldwide" as const,
    lookingFor: ["Investor" as const],
    ideaTags: ["SaaS"],
  };
  assert.equal(
    profileUpdateSchema.safeParse({
      ...base,
      photo: "https://cdn.example.com/u/randomuser.me.jpg",
    }).success,
    true
  );
  for (const photo of [
    "https://randomuser.me/api/portraits/men/32.jpg",
    "https://randomuser.me/other.jpg",
    "https://www.randomuser.me/api/portraits/women/44.jpg",
  ]) {
    assert.equal(profileUpdateSchema.safeParse({ ...base, photo }).success, false, photo);
    assert.equal(isRandomUserPhotoHost(photo), true, photo);
  }
  assert.equal(
    classifySample({
      id: "cm_real_member",
      email: "ada@company.com",
      photo: "https://randomuser.me/other.jpg",
      isSample: false,
      sampleKind: "",
    }),
    null
  );
});

test("sample photo filter is the exact portrait list", () => {
  const where = sampleMemberWhere();
  const clauses = Array.isArray(where.OR) ? where.OR : [];
  const photo = clauses.find((clause) => clause && typeof clause === "object" && "photo" in clause);
  assert.ok(photo && photo.photo && typeof photo.photo === "object" && "in" in photo.photo);
  const urls = photo.photo.in as string[];
  assert.equal(urls.includes("https://randomuser.me/api/portraits/men/32.jpg"), true);
  assert.equal(urls.includes("https://randomuser.me/api/portraits/women/44.jpg"), true);
  assert.equal(urls.includes("https://cdn.example.com/randomuser.me.jpg"), false);
  assert.equal(JSON.stringify(photo).includes("contains"), false);
  for (const url of urls) assert.equal(isSamplePortraitUrl(url), true, url);
});

test("dry-run markers name the exact rule that matched", () => {
  assert.deepEqual(sampleMarkers({ id: "p1", email: "ada@conclave.app" }), ["id:p1-p18"]);
  assert.deepEqual(sampleMarkers({ id: "guest", email: "demo@conclave.app" }), [
    "email:demo@conclave.app",
  ]);
  assert.deepEqual(
    sampleMarkers({
      id: "bot",
      photo: "https://randomuser.me/api/portraits/men/32.jpg",
    }),
    ["photo:randomuser.me"]
  );
});
