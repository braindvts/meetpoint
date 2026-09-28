import assert from "node:assert/strict";
import { test } from "node:test";
import { classifySample, sampleMarkers } from "./sampleAccounts.ts";

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
