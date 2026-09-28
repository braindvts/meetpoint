import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GOOGLE_REAUTH_MAX_AGE_SEC,
  GOOGLE_REAUTH_SKEW_SEC,
  googleReauthClaimsDecision,
} from "./googleAuth.ts";

const NOW = 1_800_000_000;

function claims(overrides: {
  idTokenPresent?: boolean;
  exp?: unknown;
  nonce?: unknown;
  authTime?: unknown;
  expectedNonce?: string;
  nowSec?: number;
} = {}) {
  return googleReauthClaimsDecision({
    idTokenPresent: true,
    exp: NOW + 3600,
    nonce: "nonce-from-state",
    authTime: NOW - 30,
    expectedNonce: "nonce-from-state",
    nowSec: NOW,
    ...overrides,
  });
}

test("Google reauth rejects a missing id_token, a bad nonce, and a bad auth_time", () => {
  assert.deepEqual(claims({ idTokenPresent: false }), { ok: false, error: "mismatch" });
  assert.deepEqual(claims({ nonce: "other-nonce" }), { ok: false, error: "mismatch" });
  assert.deepEqual(claims({ authTime: undefined }), { ok: false, error: "expired" });
  const stale = NOW - (GOOGLE_REAUTH_MAX_AGE_SEC + GOOGLE_REAUTH_SKEW_SEC + 1);
  assert.deepEqual(claims({ authTime: stale }), { ok: false, error: "expired" });
});

test("Google reauth accepts a fresh auth_time and a matching nonce", () => {
  assert.deepEqual(claims(), { ok: true });
  const edge = NOW - (GOOGLE_REAUTH_MAX_AGE_SEC + GOOGLE_REAUTH_SKEW_SEC);
  assert.deepEqual(claims({ authTime: edge }), { ok: true });
});
