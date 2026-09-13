import assert from "node:assert/strict";
import { test } from "node:test";
import { emailSignupTaken } from "./emailSignup.ts";

test("signup is blocked for any existing member, including OAuth-only rows", () => {
  assert.equal(emailSignupTaken(null), false);
  assert.equal(emailSignupTaken(undefined), false);
  assert.equal(emailSignupTaken({ id: "oauth-member" }), true);
});
