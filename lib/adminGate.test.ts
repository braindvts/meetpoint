import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import {
  ADMIN_SESSION_MS,
  adminCookieValid,
  canViewAdminDashboard,
  signAdminCookie,
} from "./adminGate.ts";

const SECRET = "operator-secret-for-tests";
const NOW = 1_700_000_000_000;

test("non-admins are blocked from the dashboard gate", () => {
  assert.equal(canViewAdminDashboard({}), false);
  assert.equal(
    canViewAdminDashboard({
      email: "stranger@example.com",
      adminEmails: "brian@interlink.test",
      adminSecret: SECRET,
    }),
    false
  );
  assert.equal(
    canViewAdminDashboard({
      email: "brian@interlink.test",
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

test("an unverified listed email is denied", () => {
  assert.equal(
    canViewAdminDashboard({
      email: "brian@interlink.test",
      adminEmails: "brian@interlink.test",
      emailVerifiedAt: null,
      googleId: null,
      appleId: null,
    }),
    false
  );
  assert.equal(
    canViewAdminDashboard({
      email: "Brian@Interlink.test",
      adminEmails: " brian@interlink.test ",
      emailVerifiedAt: "   ",
    }),
    false
  );
});

test("a verified listed email is allowed", () => {
  assert.equal(
    canViewAdminDashboard({
      email: "Brian@Interlink.test",
      adminEmails: " brian@interlink.test, ops@interlink.test ",
      emailVerifiedAt: "2026-09-01T00:00:00.000Z",
    }),
    true
  );
});

test("Google or Apple sign-in allows a listed email", () => {
  assert.equal(
    canViewAdminDashboard({
      email: "brian@interlink.test",
      adminEmails: "brian@interlink.test",
      googleId: "google-sub-1",
    }),
    true
  );
  assert.equal(
    canViewAdminDashboard({
      email: "brian@interlink.test",
      adminEmails: "brian@interlink.test",
      appleId: "apple-sub-1",
    }),
    true
  );
  assert.equal(
    canViewAdminDashboard({
      email: "brian@interlink.test",
      adminEmails: "someone-else@interlink.test",
      googleId: "google-sub-1",
    }),
    false
  );
});

test("allowlisted email and a valid admin cookie can open the dashboard", () => {
  assert.equal(
    canViewAdminDashboard({
      email: "Brian@Interlink.test",
      adminEmails: " brian@interlink.test, ops@interlink.test ",
      emailVerifiedAt: "2026-09-01T00:00:00.000Z",
    }),
    true
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

test("analytics page 404s when the server gate denies access", () => {
  const page = readFileSync(join(import.meta.dirname, "../app/admin/analytics/page.tsx"), "utf8");
  assert.match(page, /canViewAdminDashboard/);
  assert.match(page, /adminIdentityFromMember/);
  assert.match(page, /if \(!allowed\) notFound\(\)/);
  const sample = readFileSync(
    join(import.meta.dirname, "../app/admin/analytics/sample/page.tsx"),
    "utf8"
  );
  assert.match(sample, /NODE_ENV === "production"/);
  assert.match(sample, /notFound\(\)/);
});
