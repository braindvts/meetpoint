import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import {
  ADMIN_SESSION_MS,
  adminCookieValid,
  adminEmailIsVerified,
  adminIdentityFromAuth,
  adminNavLinkFor,
  canViewAdminDashboard,
  signAdminCookie,
} from "./adminGate.ts";

const SECRET = "operator-secret-for-tests";
const NOW = 1_700_000_000_000;

test("non-admins are blocked from the dashboard gate", () => {
  assert.equal(canViewAdminDashboard({}), false);
  assert.equal(
    canViewAdminDashboard({
      adminEmails: "brian@interlink.test",
      adminSecret: SECRET,
    }),
    false
  );
  assert.equal(
    canViewAdminDashboard({
      adminEmails: "",
      cookie: "v1.1.forged",
      adminSecret: SECRET,
      now: NOW,
    }),
    false
  );
  const token = signAdminCookie(SECRET, NOW);
  assert.equal(
    canViewAdminDashboard({
      cookie: token,
      adminSecret: "different-secret",
      now: NOW + 1_000,
    }),
    false
  );
  assert.equal(
    canViewAdminDashboard({
      cookie: token,
      adminSecret: SECRET,
      now: NOW + ADMIN_SESSION_MS + 1,
    }),
    false
  );
});

test("emailVerifiedAt alone does not grant a listed email", () => {
  const identity = adminIdentityFromAuth(
    {
      email: "brian@interlink.test",
      emailVerifiedAt: "2026-09-01T00:00:00.000Z",
      googleId: null,
      appleId: null,
    },
    { id: "member-1", email: "brian@interlink.test", provider: "email" }
  );
  assert.equal(identity.googleEmail, null);
  assert.equal(identity.appleEmail, null);
  assert.equal(
    canViewAdminDashboard({
      ...identity,
      adminEmails: "brian@interlink.test",
    }),
    false
  );
  assert.equal(
    canViewAdminDashboard({
      googleId: "   ",
      appleId: "",
      googleEmail: "brian@interlink.test",
      adminEmails: "brian@interlink.test",
    }),
    false
  );
});

test("Google or Apple provider email allows a listed address", () => {
  const google = adminIdentityFromAuth(
    { email: "typed-later@attacker.test", googleId: "google-sub-1", appleId: null },
    { id: "google-sub-1", email: "Brian@Interlink.test", provider: "google" }
  );
  assert.equal(google.googleEmail, "Brian@Interlink.test");
  assert.equal(
    canViewAdminDashboard({
      ...google,
      adminEmails: " brian@interlink.test, ops@interlink.test ",
    }),
    true
  );

  const apple = adminIdentityFromAuth(
    { email: "typed-later@attacker.test", googleId: null, appleId: "apple-sub-1" },
    { id: "apple-sub-1", email: "ops@interlink.test", provider: "apple" }
  );
  assert.equal(
    canViewAdminDashboard({
      ...apple,
      adminEmails: "brian@interlink.test, ops@interlink.test",
    }),
    true
  );
});

test("account email is not the provider email", () => {
  const linkedButDifferent = adminIdentityFromAuth(
    { email: "brian@interlink.test", googleId: "google-sub-1" },
    { id: "google-sub-1", email: "attacker@gmail.com", provider: "google" }
  );
  assert.equal(linkedButDifferent.googleEmail, "attacker@gmail.com");
  assert.equal(
    canViewAdminDashboard({
      ...linkedButDifferent,
      adminEmails: "brian@interlink.test",
    }),
    false
  );

  const idWithoutProviderEmail = adminIdentityFromAuth(
    { email: "brian@interlink.test", googleId: "google-sub-1" },
    { id: "google-sub-1", email: "  ", provider: "google" }
  );
  assert.equal(idWithoutProviderEmail.googleEmail, null);
  assert.equal(
    canViewAdminDashboard({
      ...idWithoutProviderEmail,
      adminEmails: "brian@interlink.test",
    }),
    false
  );

  const subjectMismatch = adminIdentityFromAuth(
    { email: "brian@interlink.test", googleId: "google-sub-1" },
    { id: "other-sub", email: "brian@interlink.test", provider: "google" }
  );
  assert.equal(subjectMismatch.googleEmail, null);
  assert.equal(
    canViewAdminDashboard({
      ...subjectMismatch,
      adminEmails: "brian@interlink.test",
    }),
    false
  );
});

test("allowlisted email and a valid admin cookie can open the dashboard", () => {
  assert.equal(
    canViewAdminDashboard({
      adminEmails: " brian@interlink.test, ops@interlink.test ",
      googleId: null,
      googleEmail: null,
    }),
    false
  );
  const token = signAdminCookie(SECRET, NOW);
  assert.equal(adminCookieValid(token, SECRET, NOW + 1_000), true);
  assert.equal(
    canViewAdminDashboard({
      cookie: token,
      adminSecret: SECRET,
      now: NOW + 1_000,
    }),
    true
  );
  const tampered = `${token.slice(0, -2)}aa`;
  assert.equal(adminCookieValid(tampered, SECRET, NOW + 1_000), false);
});

test("emailVerifiedAt does not count until the confirmation link exists", () => {
  assert.equal(
    adminEmailIsVerified({
      email: "brian@interlink.test",
      emailVerifiedAt: "2026-09-01T00:00:00.000Z",
      adminEmails: "brian@interlink.test",
    }),
    false
  );
  assert.equal(
    adminEmailIsVerified({
      email: "someone@else.test",
      emailVerifiedAt: "2026-09-01T00:00:00.000Z",
      googleId: "google-sub-1",
      googleEmail: "brian@interlink.test",
      adminEmails: "brian@interlink.test",
    }),
    true
  );
  const gate = readFileSync(join(import.meta.dirname, "adminGate.ts"), "utf8");
  assert.match(gate, /export function adminEmailIsVerified/);
  assert.match(gate, /confirmedByLink = false/);
  assert.match(gate, /one-time expiring confirmation/);
  assert.match(gate, /adminEmailIsVerified\(input\)/);
});

test("non-admins do not get the admin nav link", () => {
  assert.equal(adminNavLinkFor(false), null);
  assert.equal(adminNavLinkFor(canViewAdminDashboard({})), null);
  const nav = readFileSync(join(import.meta.dirname, "../components/Nav.tsx"), "utf8");
  assert.equal(nav.includes("/admin/analytics"), false);
  assert.equal(nav.includes(">Admin<"), false);
  const site = readFileSync(join(import.meta.dirname, "../components/SiteNav.tsx"), "utf8");
  assert.match(site, /adminNavLinkFor/);
  assert.match(site, /canViewAdminFromRequest/);
  assert.match(site, /link \?/);
  const access = readFileSync(join(import.meta.dirname, "adminAccess.ts"), "utf8");
  assert.match(access, /canViewAdminDashboard/);
  assert.match(access, /adminIdentityFromAuth/);
  assert.match(access, /getSession/);
});

test("analytics page 404s when the server gate denies access", () => {
  const page = readFileSync(join(import.meta.dirname, "../app/admin/analytics/page.tsx"), "utf8");
  assert.match(page, /canViewAdminFromRequest/);
  assert.match(page, /if \(!allowed\) notFound\(\)/);
  const gate = readFileSync(join(import.meta.dirname, "adminGate.ts"), "utf8");
  assert.equal(gate.includes("googleEmail: member?.email"), false);
  const sample = readFileSync(
    join(import.meta.dirname, "../app/admin/analytics/sample/page.tsx"),
    "utf8"
  );
  assert.match(sample, /NODE_ENV === "production"/);
  assert.match(sample, /notFound\(\)/);
});
