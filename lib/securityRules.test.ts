import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import type { Member } from "@prisma/client";
import { requireAdmin, requireReportAdmin } from "./adminAuth.ts";
import {
  AUTH_LOCK_ACCOUNT_FAILS,
  AUTH_LOCK_PAIR_FAILS,
  clearAuthFailures,
  isAuthLocked,
  recordAuthFailure,
  resetAuthLockoutForTests,
} from "./authLockout.ts";
import { adminNotifyEmails } from "./email.ts";
import { googleProfileFromClaims } from "./googleAuth.ts";
import { memberToPerson, profileToMemberData } from "./memberMap.ts";
import { AUTH_SIGNUP_IP } from "./rateCaps.ts";
import { accountKey, hashIp, rateLimitStorageKey } from "./rateLimit.ts";
import { secretsMatch } from "./secretCompare.ts";
import {
  AUTO_HIDE_MIN_ACCOUNT_AGE_MS,
  OPEN_REPORT_HIDE_THRESHOLD,
  autoHiddenFromRows,
  chatInvolvesBlock,
  consumeBucket,
  filterAttendeeIds,
  memberAuthSource,
  reporterCountsTowardAutoHide,
  shouldAutoHide,
  visibleInDiscover,
} from "./safetyRules.ts";
import { tierForPerson } from "./tiers.ts";
import type { Person, ReputationSummary } from "./types.ts";
import { profileUpdateSchema } from "./validation/profile.ts";
import { reportSchema } from "./validation/safety.ts";

const ROOT = join(import.meta.dirname, "..");

function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf8");
}

function member(overrides: Partial<Member> = {}): Member {
  return {
    id: "member_1",
    linkedInId: "li-oauth-subject",
    googleId: "google-oauth-subject",
    appleId: "apple-oauth-subject",
    email: "private@company.test",
    passwordHash: "scrypt-secret-hash",
    name: "Ada Lovelace",
    jobTitle: "Founder",
    bio: "Builds things.",
    photo: "https://cdn.example/ada.jpg",
    cityName: "London",
    cityCountry: "UK",
    cityLat: 51.5,
    cityLng: -0.1,
    travel: "worldwide",
    meetPreference: "open",
    lookingForJson: JSON.stringify(["Co-founder"]),
    ideaTagsJson: JSON.stringify(["SaaS"]),
    verificationsJson: JSON.stringify([
      { method: "company-email", value: "ada@company.test", verifiedAt: "2026-01-01" },
      { method: "linkedin", value: "https://www.linkedin.com/in/ada-real", verifiedAt: "2026-01-01" },
      { method: "website", value: "https://ada.example", verifiedAt: "2026-01-01" },
    ]),
    workJson: JSON.stringify([
      {
        title: "Engine",
        kind: "product",
        description: "Notes",
        url: "javascript:alert(1)",
      },
    ]),
    phone: "+15551230000",
    black: false,
    blackSince: null,
    blackSource: null,
    premierActive: false,
    premierInterval: null,
    premierStartedAt: null,
    premierTrialEndsAt: null,
    emailVerifiedAt: "2026-01-01",
    meetingsAttended: 4,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-02"),
    ...overrides,
  } as Member;
}

const rep = (peerId: string): ReputationSummary => ({
  peerId,
  ratingCount: 0,
  showedUpRate: 0,
  professionalRate: 0,
  valuableRate: 0,
  wouldMeetAgainRate: 0,
  score: 0,
  status: "standing",
});

test("public member cards omit email, phone, secrets, oauth ids, and verification values", () => {
  const person = memberToPerson(member());
  const blob = JSON.stringify(person);
  for (const secret of [
    "private@company.test",
    "ada@company.test",
    "+15551230000",
    "scrypt-secret-hash",
    "li-oauth-subject",
    "google-oauth-subject",
    "apple-oauth-subject",
    "ada-real",
    "ada.example",
    "javascript:",
  ]) {
    assert.equal(blob.includes(secret), false, secret);
  }
  assert.equal(person.verified, true);
  assert.deepEqual(person.verifications, []);
  assert.equal(person.linkedInUrl, undefined);
  assert.equal(person.websiteUrl, undefined);
  assert.equal(person.portfolioUrl, undefined);
  assert.equal(person.work?.[0]?.url, undefined);
  assert.equal(memberToPerson(member({ photo: "javascript:alert(1)" })).photoUrl, "");
});

test("verified standing still resolves from the public flag without credential methods", () => {
  const person: Person = {
    id: "pub",
    name: "Ada",
    jobTitle: "Founder",
    ideaTags: ["SaaS"],
    lookingFor: ["Co-founder"],
    bio: "Hi",
    city: { name: "London", country: "UK", lat: 0, lng: 0 },
    travel: "worldwide",
    photoUrl: "https://cdn.example/a.jpg",
    verifications: [],
    verified: true,
  };
  assert.equal(tierForPerson(person, rep("pub")), 2);
});

test("auto-hide uses a single threshold of three distinct open reporters", () => {
  assert.equal(OPEN_REPORT_HIDE_THRESHOLD, 3);
  assert.equal(shouldAutoHide(2), false);
  assert.equal(shouldAutoHide(3), true);
  const rows = [
    { peerId: "p", reporterId: "a" },
    { peerId: "p", reporterId: "a" },
    { peerId: "p", reporterId: "b" },
    { peerId: "p", reporterId: "c" },
    { peerId: "q", reporterId: "a" },
  ];
  assert.deepEqual([...autoHiddenFromRows(rows)], ["p"]);
});

test("blocks hide people from discover, attendees, and chats", () => {
  const blocked = new Set(["b"]);
  assert.deepEqual(visibleInDiscover(["a", "b", "c", "me"], "me", blocked, new Set(["c"])), ["a"]);
  assert.deepEqual(filterAttendeeIds(["a", "b", "c"], blocked), ["a", "c"]);
  assert.equal(chatInvolvesBlock(["a", "b"], blocked), true);
  assert.equal(chatInvolvesBlock(["a"], blocked), false);
});

test("a live session never falls through to another member cookie", () => {
  assert.equal(memberAuthSource(true, true, true), "session");
  assert.equal(memberAuthSource(true, false, true), "none");
  assert.equal(memberAuthSource(false, false, true), "cookie");
  assert.equal(memberAuthSource(false, false, false), "none");
});

test("account rate-limit keys are hashes, not raw emails", () => {
  const email = "Person@Company.test";
  const hashed = accountKey(email);
  assert.notEqual(hashed, email);
  assert.match(hashed, /^[a-f0-9]{24}$/);
  assert.equal(accountKey(email), accountKey("person@company.test"));
  const key = rateLimitStorageKey("1.2.3.4", {
    name: "auth-signup-acct",
    limit: 3,
    windowMs: 1000,
    scope: "account",
    keyExtra: hashed,
  });
  assert.equal(key.includes(email), false);
  assert.equal(key.includes("1.2.3.4"), false);
  const ipKey = rateLimitStorageKey(
    "203.0.113.9",
    { name: "auth-email", limit: 1, windowMs: 1 },
    "test-secret"
  );
  assert.match(ipKey, /^auth-email:ip:[a-f0-9]{24}$/);
  assert.equal(ipKey.includes("203.0.113.9"), false);
  assert.equal(
    ipKey,
    rateLimitStorageKey("203.0.113.9", { name: "auth-email", limit: 1, windowMs: 1 }, "test-secret")
  );
  assert.notEqual(
    ipKey,
    rateLimitStorageKey("203.0.113.10", { name: "auth-email", limit: 1, windowMs: 1 }, "test-secret")
  );
  assert.notEqual(
    ipKey,
    rateLimitStorageKey("203.0.113.9", { name: "auth-email", limit: 1, windowMs: 1 }, "other-secret")
  );
  assert.equal(hashIp("203.0.113.9", "test-secret"), hashIp("203.0.113.9", "test-secret"));
});

test("fixed window blocks the request after the limit", () => {
  const buckets = new Map();
  const opts = { limit: 2, windowMs: 1_000, now: 1_000 };
  assert.equal(consumeBucket(buckets, "k", opts.limit, opts.windowMs, opts.now).allowed, true);
  assert.equal(consumeBucket(buckets, "k", opts.limit, opts.windowMs, opts.now).allowed, true);
  const denied = consumeBucket(buckets, "k", opts.limit, opts.windowMs, opts.now);
  assert.equal(denied.allowed, false);
  assert.ok(denied.retryAfterSec >= 1);
});

test("report body cannot name the reporter and must use a known category", () => {
  const good = reportSchema.safeParse({
    peerId: "peer_1",
    category: "spam",
    reason: "Sent the same pitch ten times.",
    alsoBlock: true,
  });
  assert.equal(good.success, true);

  assert.equal(
    reportSchema.safeParse({
      peerId: "peer_1",
      reporterId: "attacker",
      category: "spam",
      reason: "Not allowed",
    }).success,
    false
  );
  assert.equal(
    reportSchema.safeParse({
      peerId: "peer_1",
      category: "bullying",
      reason: "Not a category",
    }).success,
    false
  );
  assert.equal(
    reportSchema.safeParse({
      peerId: "peer_1",
      category: "other",
      reason: "no",
    }).success,
    false
  );
  assert.equal(
    reportSchema.safeParse({
      peerId: "peer_1",
      category: "other",
      reason: "x".repeat(501),
    }).success,
    false
  );
});

test("profile writes reject secrets, free-text tags, and unsafe photos", () => {
  const city = { name: "London", country: "UK", lat: 51.5, lng: -0.12 };
  const base = {
    name: "Ada",
    jobTitle: "Founder",
    bio: "Building.",
    photo: "https://cdn.example/ada.jpg",
    city,
    travel: "worldwide",
    lookingFor: ["Co-founder"],
    ideaTags: ["SaaS"],
    phone: "",
  };
  assert.equal(profileUpdateSchema.safeParse(base).success, true);
  assert.equal(
    profileUpdateSchema.safeParse({ ...base, photo: "javascript:alert(1)" }).success,
    false
  );
  assert.equal(
    profileUpdateSchema.safeParse({ ...base, ideaTags: ["Neighborhood supper clubs"] }).success,
    true
  );
  assert.equal(
    profileUpdateSchema.safeParse({ ...base, ideaTags: ["https://spam.test/offer"] }).success,
    false
  );
  assert.equal(
    profileUpdateSchema.safeParse({ ...base, ideaTags: ["<script>alert(1)</script>"] }).success,
    false
  );
  const stored = profileToMemberData({
    name: "Ada",
    jobTitle: "Founder",
    ideaTags: ["SaaS", "Neighborhood supper clubs", "https://spam.test", "<b>no</b>"],
    lookingFor: ["Co-founder"],
    bio: "Building.",
    city,
    travel: "worldwide",
    meetPreference: "open",
    photo: "https://cdn.example/ada.jpg",
    verifications: [],
  });
  assert.deepEqual(JSON.parse(stored.ideaTagsJson), ["SaaS", "Neighborhood supper clubs"]);
  assert.equal(
    profileUpdateSchema.safeParse({ ...base, bio: "x".repeat(801) }).success,
    false
  );
  assert.equal(
    profileUpdateSchema.safeParse({ ...base, email: "ada@company.test" }).success,
    false
  );
  assert.equal(
    profileUpdateSchema.safeParse({
      ...base,
      photo: "data:image/svg+xml;base64,PHN2Zy8+",
    }).success,
    false
  );
});

test("admin auth is the env secret, compared in constant time", () => {
  const previous = process.env.ADMIN_SECRET;
  process.env.ADMIN_SECRET = "correct-horse";
  try {
    const ok = requireAdmin(new Request("https://interlink.test/api/report", {
      headers: { authorization: "Bearer correct-horse" },
    }));
    assert.equal(ok.ok, true);
    const bad = requireAdmin(new Request("https://interlink.test/api/report", {
      headers: { authorization: "Bearer wrong-horse" },
    }));
    assert.equal(bad.ok, false);
    if (!bad.ok) assert.equal(bad.response.status, 401);
    assert.equal(secretsMatch("correct-horse", "correct-horse"), true);
    assert.equal(secretsMatch("correct-horse", "correct-horses"), false);
  } finally {
    if (previous === undefined) delete process.env.ADMIN_SECRET;
    else process.env.ADMIN_SECRET = previous;
  }
});

test("google email is ignored unless Google verified it", () => {
  const unverified = googleProfileFromClaims({
    sub: "g1",
    email: "victim@company.test",
    email_verified: false,
  });
  assert.equal(unverified.email, undefined);
  const verified = googleProfileFromClaims({
    sub: "g1",
    email: "Owner@Company.test",
    email_verified: true,
  });
  assert.equal(verified.email, "owner@company.test");
});

test("report, block, and member routes keep auth on the server", () => {
  const report = read("app/api/report/route.ts");
  assert.match(report, /getCurrentMember\(\)/);
  assert.match(report, /requireReportAdmin\(req\)/);
  assert.match(report, /sendAutoHideAlert/);
  const adminAuth = read("lib/adminAuth.ts");
  assert.match(adminAuth, /function requireReportAdmin/);
  assert.match(adminAuth, /canViewAdminDashboard/);
  assert.match(report, /reporterId: me\.id/);
  assert.doesNotMatch(report, /reporterId:\s*parsed\.data/);
  assert.doesNotMatch(report, /email:\s*true/);
  assert.match(report, /peerId === me\.id/);

  const connections = read("app/api/connections/route.ts");
  assert.match(connections, /pairIsBlocked/);
  assert.match(connections, /blockedPeerIdSet/);

  const messages = read("app/api/chats/[id]/messages/route.ts");
  assert.match(messages, /chatBlockedFor/);
  assert.match(messages, /blockedPeerIdSet/);

  const members = read("app/api/members/route.ts");
  assert.match(members, /discoverExcludedIds/);
  assert.match(members, /memberToPerson/);

  const blocks = read("app/api/blocks/route.ts");
  assert.match(blocks, /action === "unblock"/);
  assert.match(blocks, /Unauthorized/);

  const events = read("app/api/events/route.ts");
  assert.match(events, /filterAttendeeIds/);
  assert.match(events, /blockedPeerIdSet/);
  assert.match(events, /catch/);
  assert.match(events, /getPublishedEvents\(\)/);

  const sms = read("app/api/notify/sms/route.ts");
  assert.match(sms, /digitsOnly\(me\?\.phone/);
  assert.doesNotMatch(sms, /got !== secret/);

  const emailAuth = read("app/api/auth/email/route.ts");
  assert.match(emailAuth, /emailSignupTaken\(existing\)/);
  assert.match(emailAuth, /AUTH_SIGNUP_IP/);
  assert.match(emailAuth, /auth-signup-acct|AUTH_SIGNUP_ACCOUNT/);
  assert.doesNotMatch(emailAuth, /auth-signin-acct/);
  assert.ok(AUTH_SIGNUP_IP.limit >= 80);

  const apple = read("app/api/auth/apple/callback/route.ts");
  assert.match(apple, /verifyAppleIdToken/);
});

test("only trusted reporters count toward auto-hide", () => {
  const now = Date.parse("2026-09-28T00:00:00.000Z");
  const fresh = { createdAt: new Date(now - 60_000), name: "New", photo: "", jobTitle: "" };
  assert.equal(reporterCountsTowardAutoHide(fresh, now), false);
  assert.equal(
    reporterCountsTowardAutoHide({ ...fresh, emailVerifiedAt: "2026-09-01T00:00:00.000Z" }, now),
    true
  );
  assert.equal(reporterCountsTowardAutoHide({ ...fresh, googleId: "g-1" }, now), true);
  assert.equal(reporterCountsTowardAutoHide({ ...fresh, appleId: "a-1" }, now), true);
  assert.equal(reporterCountsTowardAutoHide({ ...fresh, linkedInId: "li-1" }, now), true);
  assert.equal(
    reporterCountsTowardAutoHide(
      {
        ...fresh,
        name: "Ada",
        photo: "https://cdn.example/ada.jpg",
        jobTitle: "Founder",
        lookingFor: ["Co-founder"],
        ideaTags: ["SaaS"],
      },
      now
    ),
    true
  );
  assert.equal(
    reporterCountsTowardAutoHide(
      { ...fresh, createdAt: new Date(now - AUTO_HIDE_MIN_ACCOUNT_AGE_MS + 60_000) },
      now
    ),
    false
  );
  assert.equal(
    reporterCountsTowardAutoHide(
      { ...fresh, createdAt: new Date(now - AUTO_HIDE_MIN_ACCOUNT_AGE_MS) },
      now
    ),
    true
  );
});

test("failed login locks the IP pair before the account", () => {
  resetAuthLockoutForTests();
  const email = "member@example.com";
  const previous = {
    gate: process.env.ENABLE_WALKTHROUGH_OWNER,
    mailbox: process.env.WALKTHROUGH_OWNER_EMAIL,
    password: process.env.WALKTHROUGH_OWNER_PASSWORD,
  };
  delete process.env.ENABLE_WALKTHROUGH_OWNER;
  delete process.env.WALKTHROUGH_OWNER_EMAIL;
  delete process.env.WALKTHROUGH_OWNER_PASSWORD;
  try {
    for (let i = 0; i < AUTH_LOCK_PAIR_FAILS; i += 1) recordAuthFailure(email, "198.51.100.1");
    assert.equal(isAuthLocked(email, "198.51.100.1"), true);
    assert.equal(isAuthLocked(email, "198.51.100.2"), false);

    clearAuthFailures(email, "198.51.100.1");
    for (let i = 0; i < AUTH_LOCK_ACCOUNT_FAILS; i += 1) {
      recordAuthFailure(email, `198.51.100.${i % 40}:${i}`);
    }
    assert.equal(isAuthLocked(email, "203.0.113.50"), true);
  } finally {
    resetAuthLockoutForTests();
    if (previous.gate === undefined) delete process.env.ENABLE_WALKTHROUGH_OWNER;
    else process.env.ENABLE_WALKTHROUGH_OWNER = previous.gate;
    if (previous.mailbox === undefined) delete process.env.WALKTHROUGH_OWNER_EMAIL;
    else process.env.WALKTHROUGH_OWNER_EMAIL = previous.mailbox;
    if (previous.password === undefined) delete process.env.WALKTHROUGH_OWNER_PASSWORD;
    else process.env.WALKTHROUGH_OWNER_PASSWORD = previous.password;
  }
});

test("the walkthrough mailbox is exempt from the account-wide login lock", () => {
  resetAuthLockoutForTests();
  const previous = {
    gate: process.env.ENABLE_WALKTHROUGH_OWNER,
    demo: process.env.ENABLE_DEMO_PROFILES,
    mailbox: process.env.WALKTHROUGH_OWNER_EMAIL,
    password: process.env.WALKTHROUGH_OWNER_PASSWORD,
  };
  process.env.ENABLE_DEMO_PROFILES = "1";
  process.env.ENABLE_WALKTHROUGH_OWNER = "1";
  process.env.WALKTHROUGH_OWNER_EMAIL = "owner@walkthrough.test";
  process.env.WALKTHROUGH_OWNER_PASSWORD = "sample-password";
  const email = "owner@walkthrough.test";
  try {
    for (let i = 0; i < AUTH_LOCK_ACCOUNT_FAILS + 5; i += 1) {
      recordAuthFailure(email, `198.51.100.${i}`);
    }
    assert.equal(isAuthLocked(email, "203.0.113.8"), false);
    for (let i = 0; i < AUTH_LOCK_PAIR_FAILS; i += 1) recordAuthFailure(email, "203.0.113.8");
    assert.equal(isAuthLocked(email, "203.0.113.8"), true);
    assert.equal(isAuthLocked(email, "203.0.113.9"), false);
  } finally {
    resetAuthLockoutForTests();
    if (previous.gate === undefined) delete process.env.ENABLE_WALKTHROUGH_OWNER;
    else process.env.ENABLE_WALKTHROUGH_OWNER = previous.gate;
    if (previous.demo === undefined) delete process.env.ENABLE_DEMO_PROFILES;
    else process.env.ENABLE_DEMO_PROFILES = previous.demo;
    if (previous.mailbox === undefined) delete process.env.WALKTHROUGH_OWNER_EMAIL;
    else process.env.WALKTHROUGH_OWNER_EMAIL = previous.mailbox;
    if (previous.password === undefined) delete process.env.WALKTHROUGH_OWNER_PASSWORD;
    else process.env.WALKTHROUGH_OWNER_PASSWORD = previous.password;
  }
});

test("admin alert recipients come from ADMIN_EMAILS and the report gate stays swappable", () => {
  const previous = process.env.ADMIN_EMAILS;
  process.env.ADMIN_EMAILS = "ops@interlink.test, ops@interlink.test not-an-email";
  try {
    assert.deepEqual(adminNotifyEmails(), ["ops@interlink.test"]);
  } finally {
    if (previous === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = previous;
  }
  const previousSecret = process.env.ADMIN_SECRET;
  process.env.ADMIN_SECRET = "queue-secret";
  try {
    const ok = requireReportAdmin(
      new Request("https://interlink.test/api/report", {
        headers: { authorization: "Bearer queue-secret" },
      })
    );
    assert.equal(ok.ok, true);
  } finally {
    if (previousSecret === undefined) delete process.env.ADMIN_SECRET;
    else process.env.ADMIN_SECRET = previousSecret;
  }
});
