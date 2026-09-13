import assert from "node:assert/strict";
import { test } from "node:test";
import { matchesWalkthroughOwner, walkthroughOwnerCredentials } from "./walkthroughOwner.ts";

const gated = {
  ENABLE_WALKTHROUGH_OWNER: "1",
  WALKTHROUGH_OWNER_EMAIL: "local-walkthrough@example.test",
  WALKTHROUGH_OWNER_PASSWORD: "local-only-password",
};

test("walkthrough is off when the server gate is unset", () => {
  assert.equal(walkthroughOwnerCredentials({}), null);
  assert.equal(
    matchesWalkthroughOwner("local-walkthrough@example.test", "local-only-password", {}),
    false
  );
});

test("walkthrough is off when the gate is on but mailbox or password is missing", () => {
  assert.equal(walkthroughOwnerCredentials({ ENABLE_WALKTHROUGH_OWNER: "1" }), null);
  assert.equal(
    matchesWalkthroughOwner("anyone@example.com", "password12", {
      ENABLE_WALKTHROUGH_OWNER: "1",
      WALKTHROUGH_OWNER_EMAIL: "anyone@example.com",
    }),
    false
  );
});

test("walkthrough matches only the env mailbox and password", () => {
  assert.deepEqual(walkthroughOwnerCredentials(gated), {
    email: "local-walkthrough@example.test",
    password: "local-only-password",
  });
  assert.equal(
    matchesWalkthroughOwner("local-walkthrough@example.test", "local-only-password", gated),
    true
  );
  assert.equal(
    matchesWalkthroughOwner("other@example.test", "local-only-password", gated),
    false
  );
  assert.equal(
    matchesWalkthroughOwner("local-walkthrough@example.test", "wrong-password", gated),
    false
  );
});

test("public demo flags do not enable walkthrough login", () => {
  assert.equal(
    matchesWalkthroughOwner("local-walkthrough@example.test", "local-only-password", {
      NEXT_PUBLIC_ENABLE_DEMO: "1",
      NEXT_PUBLIC_ENABLE_DEMO_PROFILES: "1",
      WALKTHROUGH_OWNER_EMAIL: "local-walkthrough@example.test",
      WALKTHROUGH_OWNER_PASSWORD: "local-only-password",
    }),
    false
  );
});
