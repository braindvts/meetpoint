import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { accountDeletionDecision, anonymizedMemberData } from "./accountDeletion";
import {
  PRIVACY_VERSION,
  TERMS_VERSION,
  hasCurrentLegalConsent,
  legalConsentStamp,
} from "./legal";
import { REPORT_CATEGORIES, REPORT_DIALOG_CATEGORIES } from "./reportLabels";
import { paidBookingMatches } from "./stripeBooking";
import { emailAuthSchema, legalConsentSchema } from "./validation/auth";

const ROOT = join(import.meta.dirname, "..");

test("current legal consent requires both versions and timestamps", () => {
  const stamp = legalConsentStamp(new Date("2026-09-28T00:00:00.000Z"));
  assert.equal(hasCurrentLegalConsent(stamp), true);
  assert.equal(stamp.termsVersion, TERMS_VERSION);
  assert.equal(stamp.privacyVersion, PRIVACY_VERSION);
  assert.equal(
    hasCurrentLegalConsent({ ...stamp, termsVersion: "old" }),
    false
  );
  assert.equal(
    hasCurrentLegalConsent({
      termsAcceptedAt: null,
      termsVersion: TERMS_VERSION,
      privacyAcceptedAt: stamp.privacyAcceptedAt,
      privacyVersion: PRIVACY_VERSION,
    }),
    false
  );
});

test("email signup rejects a missing or false consent box", () => {
  const base = {
    email: "member@example.com",
    password: "long-password",
    mode: "signup" as const,
    name: "Member",
  };
  assert.equal(emailAuthSchema.safeParse(base).success, false);
  assert.equal(
    emailAuthSchema.safeParse({ ...base, acceptTerms: false, acceptPrivacy: true }).success,
    false
  );
  assert.equal(
    emailAuthSchema.safeParse({ ...base, acceptTerms: true, acceptPrivacy: true }).success,
    true
  );
  assert.equal(
    emailAuthSchema.safeParse({
      email: "member@example.com",
      password: "long-password",
      mode: "signin",
    }).success,
    true
  );
  assert.equal(legalConsentSchema.safeParse({ acceptTerms: true, acceptPrivacy: true }).success, true);
  assert.equal(legalConsentSchema.safeParse({ acceptTerms: false, acceptPrivacy: true }).success, false);
});

test("account deletion requires the phrase and re-auth for passwords", () => {
  assert.equal(
    accountDeletionDecision({ confirm: "delete", hasPassword: false, recentReauth: false }).ok,
    false
  );
  const needsPassword = accountDeletionDecision({
    confirm: "DELETE",
    hasPassword: true,
    recentReauth: false,
  });
  assert.equal(needsPassword.ok, false);
  if (!needsPassword.ok) assert.equal(needsPassword.needsReauth, true);
  assert.equal(
    accountDeletionDecision({ confirm: "DELETE", hasPassword: true, recentReauth: true }).ok,
    true
  );
  assert.equal(
    accountDeletionDecision({ confirm: "DELETE", hasPassword: false, recentReauth: false }).ok,
    true
  );
});

test("anonymized accounts drop personal fields and keep an id-shaped record", () => {
  const row = anonymizedMemberData(new Date("2026-09-28T12:00:00.000Z"));
  assert.equal(row.name, "Deleted member");
  assert.equal(row.email, null);
  assert.equal(row.passwordHash, null);
  assert.equal(row.phone, null);
  assert.equal(row.photo, "");
  assert.equal(row.linkedInId, null);
  assert.equal(row.googleId, null);
  assert.equal(row.appleId, null);
  assert.equal(row.verificationsJson, "[]");
  assert.ok(row.deletedAt instanceof Date);
});

test("paid booking sessions must belong to the member", () => {
  assert.equal(
    paidBookingMatches(
      {
        payment_status: "paid",
        metadata: { kind: "booking", memberId: "m1", chatId: "c1" },
      },
      "m1"
    ),
    true
  );
  assert.equal(
    paidBookingMatches(
      {
        payment_status: "unpaid",
        metadata: { kind: "booking", memberId: "m1", chatId: "c1" },
      },
      "m1"
    ),
    false
  );
  assert.equal(
    paidBookingMatches(
      {
        payment_status: "paid",
        metadata: { kind: "booking", memberId: "other", chatId: "c1" },
      },
      "m1"
    ),
    false
  );
});

test("report categories add the requested reasons without dropping legacy slugs", () => {
  for (const slug of [
    "harassment",
    "spam",
    "fraud",
    "impersonation",
    "inappropriate",
    "suspicious_account",
    "fake_profile",
    "scam",
    "other",
  ]) {
    assert.ok(REPORT_CATEGORIES.includes(slug as (typeof REPORT_CATEGORIES)[number]));
  }
  assert.deepEqual(REPORT_DIALOG_CATEGORIES, [
    "harassment",
    "spam",
    "fraud",
    "impersonation",
    "inappropriate",
    "suspicious_account",
  ]);
});

test("consent, deletion, and admin authorization are enforced in server routes", () => {
  const email = readFileSync(join(ROOT, "app/api/auth/email/route.ts"), "utf8");
  const deletion = readFileSync(join(ROOT, "app/api/members/me/route.ts"), "utf8");
  const connections = readFileSync(join(ROOT, "app/api/connections/route.ts"), "utf8");
  const report = readFileSync(join(ROOT, "app/api/report/route.ts"), "utf8");
  const grant = readFileSync(join(ROOT, "app/api/black/grant/route.ts"), "utf8");
  const meeting = readFileSync(join(ROOT, "app/api/black/meeting/route.ts"), "utf8");
  assert.match(email, /legalConsentStamp/);
  assert.match(email, /acceptTerms !== true/);
  assert.match(deletion, /accountDeletionDecision/);
  assert.match(deletion, /hasRecentReauth/);
  assert.match(deletion, /anonymizedMemberData/);
  assert.doesNotMatch(deletion, /report\.delete/);
  assert.match(connections, /canIntroduceToTier/);
  assert.match(connections, /legalConsentDenied/);
  assert.match(report, /requireAdmin/);
  assert.match(grant, /requireAdmin/);
  assert.match(meeting, /paidBookingMatches/);
  assert.match(meeting, /rateLimit/);
});

test("privacy policy discloses first-party analytics and optional regional sections", () => {
  const privacy = readFileSync(join(ROOT, "app/privacy/page.tsx"), "utf8");
  const contact = readFileSync(join(ROOT, "app/contact/page.tsx"), "utf8");
  const licenses = readFileSync(join(ROOT, "THIRD_PARTY_LICENSES.md"), "utf8");
  assert.match(privacy, /pageview/);
  assert.match(privacy, /partner_click/);
  assert.match(privacy, /scrolling partner row/);
  assert.match(privacy, /loading screen/);
  assert.match(privacy, /Edgeable featured card/);
  assert.match(privacy, /LEGAL_SAFETY_CONTACT_PLACEHOLDER/);
  assert.match(privacy, /NEXT_PUBLIC_PLAUSIBLE_DOMAIN/);
  assert.doesNotMatch(privacy, /no third-party analytics trackers/i);
  assert.equal(
    (privacy.match(/\[INCLUDE IF SERVING THIS REGION, pending owner decision\]/g) || []).length,
    2
  );
  assert.match(contact, /LEGAL_SAFETY_CONTACT_PLACEHOLDER/);
  assert.match(licenses, /no external package/);
});
