import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { ADMIN_SECRET_ATTEMPT_LIMIT, limitAdminSecretAttempt } from "./adminSecretLimit.ts";

function attempt(ip: string, secret: string): Request {
  return new Request("https://interlink.test/api/admin/session", {
    method: "POST",
    headers: {
      authorization: `Bearer ${secret}`,
      "x-forwarded-for": ip,
    },
  });
}

test("admin secret attempts are capped at 5 per 15 minutes per IP", async () => {
  const ip = "203.0.113.88";
  for (let i = 0; i < ADMIN_SECRET_ATTEMPT_LIMIT; i += 1) {
    const result = await limitAdminSecretAttempt(attempt(ip, "wrong-secret"));
    assert.equal(result.ok, true, `attempt ${i + 1} should be allowed`);
  }
  const blocked = await limitAdminSecretAttempt(attempt(ip, "still-wrong"));
  assert.equal(blocked.ok, false);
  if (!blocked.ok) assert.equal(blocked.response.status, 429);

  const otherIp = await limitAdminSecretAttempt(attempt("203.0.113.89", "wrong-secret"));
  assert.equal(otherIp.ok, true);
});

test("the secret form and the session route both use the attempt cap", () => {
  const root = import.meta.dirname;
  const action = readFileSync(join(root, "../app/admin/enter/actions.ts"), "utf8");
  const route = readFileSync(join(root, "../app/api/admin/session/route.ts"), "utf8");
  assert.match(action, /limitAdminSecretAttempt/);
  assert.match(action, /error=rate/);
  assert.match(route, /limitAdminSecretAttempt/);
  const limitCall = action.indexOf("await limitAdminSecretAttempt");
  const secretCheck = action.indexOf("secretsMatch(");
  assert.ok(limitCall >= 0 && secretCheck > limitCall);
  const routeLimit = route.indexOf("await limitAdminSecretAttempt");
  const routeGate = route.indexOf("requireAdmin(");
  assert.ok(routeLimit >= 0 && routeGate > routeLimit);
});
