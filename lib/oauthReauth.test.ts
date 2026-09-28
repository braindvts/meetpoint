import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { claimOAuthNonceStored, oauthNonceKey } from "./oauthNonceStore.ts";
import { prisma } from "./db.ts";
import {
  buildReauthBindToken,
  buildReauthToken,
  createOAuthState,
  oauthStateCookieOptions,
  readReauthBindToken,
  readReauthToken,
  REAUTH_TTL_SEC,
  verifyValue,
} from "./session.ts";
import {
  decideOAuthReauth,
  evaluateOAuthState,
  OAUTH_REAUTH_TTL_SEC,
  providerAccountId,
  resetOAuthNoncesForTests,
  resolveReauthMember,
  type OAuthReauthBind,
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

function bindFor(memberId = "member-a", nonce = "nonce-1"): OAuthReauthBind {
  return { memberId, nonce, exp: NOW + 60 };
}

test("returning login matches the stored provider id, never the email", () => {
  const member = {
    googleId: "google-sub-a",
    appleId: "apple-sub-a",
    linkedInId: "linkedin-id-a",
  };
  assert.equal(providerAccountId(member, "google"), "google-sub-a");
  assert.equal(providerAccountId(member, "apple"), "apple-sub-a");
  assert.equal(providerAccountId(member, "linkedin"), "linkedin-id-a");

  for (const [provider, subject] of [
    ["google", "google-sub-a"],
    ["apple", "apple-sub-a"],
    ["linkedin", "linkedin-id-a"],
  ] as const) {
    const match = decideOAuthReauth({
      intent: { ...payload().reauth!, provider },
      nowSec: NOW,
      sessionMemberId: "member-a",
      provider,
      providerSubject: subject,
      memberProviderId: providerAccountId(member, provider),
    });
    assert.equal(match.action, "reauth", provider);
  }

  const emailAsSubject = decideOAuthReauth({
    intent: payload().reauth,
    nowSec: NOW,
    sessionMemberId: "member-a",
    provider: "google",
    providerSubject: "member-a@example.com",
    memberProviderId: member.googleId,
  });
  assert.deepEqual(emailAsSubject, { action: "deny", error: "mismatch" });
});

test("a different signed-in member is refused and an absent session needs the flow bind", () => {
  const switched = resolveReauthMember({
    sessionMemberId: "member-b",
    intentMemberId: "member-a",
    stateNonce: "nonce-1",
    bind: bindFor("member-a", "nonce-1"),
    nowSec: NOW,
  });
  assert.deepEqual(switched, { ok: false, error: "mismatch" });

  const absent = resolveReauthMember({
    sessionMemberId: null,
    intentMemberId: "member-a",
    stateNonce: "nonce-1",
    bind: null,
    nowSec: NOW,
  });
  assert.deepEqual(absent, { ok: false, error: "mismatch" });

  const appleBind = resolveReauthMember({
    sessionMemberId: null,
    intentMemberId: "member-a",
    stateNonce: "nonce-1",
    bind: bindFor(),
    nowSec: NOW,
  });
  assert.deepEqual(appleBind, { ok: true, memberId: "member-a" });

  const sessionAndBind = resolveReauthMember({
    sessionMemberId: "member-a",
    intentMemberId: "member-a",
    stateNonce: "nonce-1",
    bind: bindFor(),
    nowSec: NOW,
  });
  assert.deepEqual(sessionAndBind, { ok: true, memberId: "member-a" });

  const sessionWithoutBind = resolveReauthMember({
    sessionMemberId: "member-a",
    intentMemberId: "member-a",
    stateNonce: "nonce-1",
    bind: null,
    nowSec: NOW,
  });
  assert.deepEqual(sessionWithoutBind, { ok: false, error: "mismatch" });

  const expiredBind = resolveReauthMember({
    sessionMemberId: "member-a",
    intentMemberId: "member-a",
    stateNonce: "nonce-1",
    bind: { memberId: "member-a", nonce: "nonce-1", exp: NOW - 1 },
    nowSec: NOW,
  });
  assert.deepEqual(expiredBind, { ok: false, error: "expired" });

  const wrongNonce = resolveReauthMember({
    sessionMemberId: null,
    intentMemberId: "member-a",
    stateNonce: "nonce-1",
    bind: bindFor("member-a", "other-nonce"),
    nowSec: NOW,
  });
  assert.deepEqual(wrongNonce, { ok: false, error: "mismatch" });
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

test("reauth state is one-time, short-lived, and bound to the member who started deletion", async () => {
  assert.equal(OAUTH_REAUTH_TTL_SEC, 600);
  assert.equal(REAUTH_TTL_SEC, 600);

  const created = await createOAuthState("/profile#delete", {
    memberId: "member-a",
    provider: "apple",
  });
  assert.equal(created.reauth?.memberId, "member-a");
  assert.equal(created.reauth?.purpose, "reauth");
  assert.equal(created.reauth?.provider, "apple");
  assert.ok(created.exp - Math.floor(Date.now() / 1000) <= 600);
  assert.ok(created.exp > Math.floor(Date.now() / 1000));
  const signed = verifyValue(created.cookieValue);
  assert.ok(signed);
  assert.match(signed!, /"memberId":"member-a"/);

  const normal = await createOAuthState("/onboarding");
  assert.equal(normal.reauth, undefined);

  const token = buildReauthBindToken({
    memberId: "member-a",
    nonce: created.nonce,
    exp: created.exp,
  });
  assert.deepEqual(readReauthBindToken(token, created.exp - 1), {
    memberId: "member-a",
    nonce: created.nonce,
    exp: created.exp,
  });
  assert.equal(readReauthBindToken(token, created.exp + 1), null);

  const prev = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = "production";
    assert.deepEqual(oauthStateCookieOptions(60).sameSite, "none");
    assert.equal(oauthStateCookieOptions(60).secure, true);
    process.env.NODE_ENV = "test";
    assert.deepEqual(oauthStateCookieOptions(60).sameSite, "lax");
    assert.equal(oauthStateCookieOptions(60).secure, false);
  } finally {
    if (prev === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = prev;
  }

  resetOAuthNoncesForTests();
  const nonce = `once-${created.nonce}`;
  const exp = Math.floor(Date.now() / 1000) + 120;
  try {
    assert.equal(await claimOAuthNonceStored(nonce, exp), true);
    assert.equal(await claimOAuthNonceStored(nonce, exp), false);
    assert.equal(await claimOAuthNonceStored("stale-nonce", Math.floor(Date.now() / 1000) - 5), false);
  } finally {
    await prisma.rateLimitBucket.deleteMany({ where: { key: oauthNonceKey(nonce) } });
  }
});

test("password reauth is unchanged and reauth mode does not sign in or link a provider", () => {
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

  const route = readFileSync(join(ROOT, "lib/oauthReauthRoute.ts"), "utf8");
  assert.match(route, /if \(!input\.intent\) return null/);
  assert.match(route, /providerAccountId/);
  assert.match(route, /resolveReauthMember/);
  assert.match(route, /withReauth/);
  assert.match(route, /where: \{ id: resolved\.memberId, deletedAt: null \}/);
  assert.doesNotMatch(route, /withSession/);
  assert.doesNotMatch(route, /withMemberCookie/);
  assert.doesNotMatch(route, /clearSession/);
  assert.doesNotMatch(route, /prisma\.member\.create/);
  assert.doesNotMatch(route, /prisma\.member\.update/);
  assert.doesNotMatch(route, /\.email/);

  for (const file of [
    "app/api/auth/google/callback/route.ts",
    "app/api/auth/apple/callback/route.ts",
    "app/api/auth/linkedin/callback/route.ts",
  ]) {
    const src = readFileSync(join(ROOT, file), "utf8");
    const gate = src.indexOf("oauthReauthResponse");
    assert.ok(gate > 0, file);
    assert.match(src, /providerSubject: (?:user\.sub|sub)/);
    assert.match(src, /stateNonce: challenge\.nonce/);
    const create = src.indexOf("prisma.member.create");
    if (create >= 0) assert.ok(gate < create, `${file} creates after reauth`);
    const update = src.indexOf("prisma.member.update");
    if (update >= 0) assert.ok(gate < update, `${file} links after reauth`);
    const session = src.indexOf("withSession");
    if (session >= 0) assert.ok(gate < session, `${file} session after reauth`);
    const emailLookup = src.indexOf("where: { email");
    if (emailLookup >= 0) assert.ok(gate < emailLookup, `${file} email lookup after reauth`);
  }

  for (const file of [
    "app/api/auth/google/route.ts",
    "app/api/auth/apple/route.ts",
    "app/api/auth/linkedin/route.ts",
  ]) {
    const src = readFileSync(join(ROOT, file), "utf8");
    const begin = src.indexOf('searchParams.get("reauth")');
    const state = src.indexOf("await createOAuthState");
    assert.ok(begin > 0 && begin < state, file);
    assert.match(src, /next = OAUTH_REAUTH_RETURN/);
    assert.match(src, /applyReauthBindCookie\(res, intent\.memberId, nonce\)/);
    assert.doesNotMatch(src, /memberId: req\.|memberId: search/);
  }

  const sessionSrc = readFileSync(join(ROOT, "lib/session.ts"), "utf8");
  assert.match(sessionSrc, /claimOAuthNonceStored\(decision\.payload\.nonce/);
  assert.match(sessionSrc, /sameSite: "lax"/);
  assert.match(sessionSrc, /sameSite: crossSite \? \("none" as const\) : \("lax" as const\)/);

  const apple = readFileSync(join(ROOT, "app/api/auth/apple/callback/route.ts"), "utf8");
  const verifyAt = apple.indexOf("verifyAppleIdToken");
  const reauthAt = apple.indexOf("oauthReauthResponse");
  assert.ok(verifyAt > 0 && verifyAt < reauthAt);
  assert.match(apple, /https:\/\/appleid\.apple\.com\/auth\/token/);
  assert.match(apple, /nonce: challenge\.nonce/);
  assert.match(apple, /providerSubject: sub/);
  assert.doesNotMatch(apple, /form\.get\("id_token"\)/);
  assert.doesNotMatch(apple, /searchParams\.get\("id_token"\)/);

  const appleVerify = readFileSync(join(ROOT, "lib/appleIdToken.ts"), "utf8");
  assert.match(appleVerify, /appleid\.apple\.com\/auth\/keys/);
  assert.match(appleVerify, /payload\.iss !== APPLE_ISS/);
  assert.match(appleVerify, /audienceMatches/);
  assert.match(appleVerify, /AppleIdTokenError\("exp"\)/);
  assert.match(appleVerify, /nonceMatches/);
  assert.match(appleVerify, /verifyRs256/);
});
