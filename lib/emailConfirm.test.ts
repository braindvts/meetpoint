import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import {
  EMAIL_CONFIRM_TTL_MS,
  EMAIL_CONFIRM_UNCONFIGURED,
  confirmationMailPlan,
  emailTokenDecision,
  hashEmailToken,
  newEmailToken,
  normalizeAccountEmail,
} from "./emailConfirm";

const ROOT = join(import.meta.dirname, "..");

test("confirmation tokens are hashed and single-use until they expire", () => {
  const issued = newEmailToken();
  assert.notEqual(issued.raw, issued.hash);
  assert.equal(issued.hash, hashEmailToken(issued.raw));
  assert.equal(EMAIL_CONFIRM_TTL_MS, 24 * 60 * 60 * 1000);
  assert.equal(normalizeAccountEmail("  Ada@Example.com "), "ada@example.com");
  assert.doesNotMatch(EMAIL_CONFIRM_UNCONFIGURED, /token/i);

  const row = {
    memberId: "m1",
    email: "ada@example.com",
    tokenHash: issued.hash,
    expiresAt: new Date(Date.now() + 60_000),
    usedAt: null,
  };
  const ok = emailTokenDecision(row, issued.hash);
  assert.equal(ok.ok, true);
  if (ok.ok) {
    assert.equal(ok.memberId, "m1");
    assert.equal(ok.email, "ada@example.com");
  }
  assert.equal(emailTokenDecision(null, issued.hash).ok, false);
  assert.match(emailTokenDecision({ ...row, tokenHash: "nope" }, issued.hash).error || "", /invalid/);
  assert.match(emailTokenDecision({ ...row, usedAt: new Date() }, issued.hash).error || "", /already used/);
  assert.match(
    emailTokenDecision({ ...row, expiresAt: new Date(Date.now() - 1000) }, issued.hash).error || "",
    /expired/
  );
});

test("confirmation mail prints a dev link only when Resend is unset outside production", () => {
  assert.equal(confirmationMailPlan({ RESEND_API_KEY: "re_test", NODE_ENV: "production" }), "send");
  assert.equal(confirmationMailPlan({ NODE_ENV: "development" }), "dev-link");
  assert.equal(confirmationMailPlan({ NODE_ENV: "production" }), "skip");
  assert.equal(confirmationMailPlan({ RESEND_API_KEY: "  ", NODE_ENV: "test" }), "dev-link");
});

test("account email confirmation is separate from profile business email", () => {
  const verify = readFileSync(join(ROOT, "app/api/verify/route.ts"), "utf8");
  const signup = readFileSync(join(ROOT, "app/api/auth/email/route.ts"), "utf8");
  const deletion = readFileSync(join(ROOT, "lib/accountDeletion.ts"), "utf8");
  const route = readFileSync(join(ROOT, "app/api/members/me/route.ts"), "utf8");
  const schema = readFileSync(join(ROOT, "prisma/schema.prisma"), "utf8");
  assert.doesNotMatch(verify, /emailVerifiedAt/);
  assert.match(signup, /issueEmailConfirmation/);
  assert.match(route, /anonymizeDeletedAccount/);
  assert.match(deletion, /emailVerificationToken\.deleteMany/);
  assert.match(schema, /model EmailVerificationToken/);
  assert.match(schema, /model EventInterest \{/);
});
