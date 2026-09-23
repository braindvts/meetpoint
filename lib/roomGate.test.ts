import assert from "node:assert/strict";
import { test } from "node:test";
import { isUsableProfile } from "./roomGate.ts";
import type { MyProfile } from "./types.ts";

const base = {
  name: "Brian",
  jobTitle: "Founder",
  verifications: [],
} as MyProfile;

test("a Member with identity and no verifications can leave login", () => {
  assert.equal(isUsableProfile(base), true);
  assert.equal(isUsableProfile({ ...base, verifications: undefined }), true);
});

test("a name without a role still needs onboarding", () => {
  assert.equal(isUsableProfile({ ...base, jobTitle: "  " }), false);
  assert.equal(isUsableProfile(null), false);
});
