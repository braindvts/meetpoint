import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { buildReauthToken, readReauthToken } from "./session.ts";
import {
  decideOAuthReauth,
  evaluateOAuthState,
  oauthReauthSessionGate,
  resetOAuthNoncesForTests,
  type OAuthStatePayload,
} from "./oauthReauth.ts";

const ROOT = join(import.meta.dirname, "..");
const NOW = 1_800_000_000;

function payload(overrides: Partial<OAuthStatePayload> = {}): OAuthStatePayload {
  return {
    state: "state-1",
    nonce: "nonce-1",
    exp: NOW + 60,
    reauth: {
      purpose: "reauth",
      memberId: "member-a",
      provider: "google",
      exp: NOW + 60,
    },
    ...overrides,
  };
}

test("OAuth reauth sets a cookie proof only for the matching member", () => {
  const match = decideOAuthReauth({
    intent: payload().reauth,
    nowSec: NOW,
    sessionMemberId: "member-a",
    provider: "google",
    providerSubject: "google-sub-a",
    memberProviderId: "google-sub-a",
  });
  assert.equal(match.action, "reauth");
  if (match.action !== "reauth") return;
  const token = buildReauthToken(match.memberId, NOW);
  assert.equal(readReauthToken(token, "member-a", NOW), true);
  assert.equal(readReauthToken(token, "member-b", NOW), false);

  const mismatch = decideOAuthReauth({
    intent: payload().reauth,
    nowSec: NOW,
    sessionMemberId: "member-a",
    provider: "google",
    providerSubject: "google-sub-b",
    memberProviderId: "google-sub-a",
  });
  assert.deepEqual(mismatch, { action: "deny", error: "mismatch" });
  assert.equal(mismatch.action === "reauth", false);
});

test("a different signed-in member cannot take the reauth cookie", () => {
  assert.equal(oauthReauthSessionGate("member-a", "member-a"), "match");
  assert.equal(oauthReauthSessionGate(null, "member-a"), "absent");
  assert.equal(oauthReauthSessionGate("member-b", "member-a"), "switch");
});

test("mismatched provider id and a different signed-in member are rejected", () => {
  const otherMember = decideOAuthReauth({
    intent: payload().reauth,
    nowSec: NOW,
    sessionMemberId: "member-b",
    provider: "google",
    providerSubject: "google-sub-a",
    memberProviderId: "google-sub-a",
  });
  assert.deepEqual(otherMember, { action: "deny", error: "mismatch" });

  const otherProvider = decideOAuthReauth({
    intent: payload().reauth,
    nowSec: NOW,
    sessionMemberId: "member-a",
    provider: "apple",
    providerSubject: "google-sub-a",
    memberProviderId: "google-sub-a",
  });
  assert.deepEqual(otherProvider, { action: "deny", error: "mismatch" });
});

test("replayed and expired OAuth reauth state is rejected", () => {
  resetOAuthNoncesForTests();
  const first = evaluateOAuthState({
    payload: payload({ nonce: "once" }),
    presentedState: "state-1",
    nowSec: NOW,
  });
  assert.equal(first.ok, true);
  const replay = evaluateOAuthState({
    payload: payload({ nonce: "once" }),
    presentedState: "state-1",
    nowSec: NOW,
  });
  assert.deepEqual(replay, { ok: false, error: "replay" });

  resetOAuthNoncesForTests();
  const expired = evaluateOAuthState({
    payload: payload({ nonce: "old", exp: NOW - 1 }),
    presentedState: "state-1",
    nowSec: NOW,
  });
  assert.deepEqual(expired, { ok: false, error: "expired" });
});

test("password reauth is unchanged and callbacks do not create accounts in reauth mode", () => {
  const password = decideOAuthReauth({
    intent: undefined,
    nowSec: NOW,
    sessionMemberId: "member-a",
    provider: "google",
    providerSubject: "ignored",
    memberProviderId: null,
  });
  assert.deepEqual(password, { action: "login" });

  const reauthRoute = readFileSync(join(ROOT, "app/api/auth/reauth/route.ts"), "utf8");
  assert.match(reauthRoute, /verifyPassword/);
  assert.doesNotMatch(reauthRoute, /oauthReauth/);
  assert.doesNotMatch(reauthRoute, /createOAuthState/);

  const ui = readFileSync(join(ROOT, "components/AccountDeletion.tsx"), "utf8");
  assert.match(ui, /signIn\.password &&/);
  assert.match(ui, /\/api\/auth\/google\?reauth=1/);
  assert.match(ui, /\/api\/auth\/apple\?reauth=1/);
  assert.match(ui, /\/api\/auth\/linkedin\?reauth=1/);

  for (const file of [
    "app/api/auth/google/callback/route.ts",
    "app/api/auth/apple/callback/route.ts",
    "app/api/auth/linkedin/callback/route.ts",
  ]) {
    const src = readFileSync(join(ROOT, file), "utf8");
    const gate = src.indexOf("oauthReauthResponse");
    assert.ok(gate > 0, file);
    const create = src.indexOf("prisma.member.create");
    if (create >= 0) assert.ok(gate < create, file);
    const session = src.indexOf("withSession");
    if (session >= 0) assert.ok(gate < session, file);
  }
});
