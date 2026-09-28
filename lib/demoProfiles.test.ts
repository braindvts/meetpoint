import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { demoProfilesServerEnabled } from "./demoProfiles.ts";

test("sample login is off unless ENABLE_DEMO_PROFILES is exactly 1", () => {
  assert.equal(demoProfilesServerEnabled({}), false);
  assert.equal(demoProfilesServerEnabled({ ENABLE_DEMO_PROFILES: "" }), false);
  assert.equal(demoProfilesServerEnabled({ ENABLE_DEMO_PROFILES: "true" }), false);
  assert.equal(
    demoProfilesServerEnabled({ NEXT_PUBLIC_ENABLE_DEMO: "1", NEXT_PUBLIC_ENABLE_DEMO_PROFILES: "1" }),
    false
  );
  assert.equal(demoProfilesServerEnabled({ ENABLE_DEMO_PROFILES: "1" }), true);
});

test("demo routes refuse unless the server gate is on", () => {
  const route = readFileSync(new URL("../app/api/auth/demo/route.ts", import.meta.url), "utf8");
  const page = readFileSync(new URL("../app/demo/page.tsx", import.meta.url), "utf8");
  const login = readFileSync(new URL("../app/login/page.tsx", import.meta.url), "utf8");
  const button = readFileSync(new URL("../components/DemoEnterButton.tsx", import.meta.url), "utf8");
  assert.match(route, /demoProfilesServerEnabled/);
  assert.match(route, /status: 404/);
  assert.match(page, /notFound\(\)/);
  assert.match(page, /demoProfilesServerEnabled/);
  assert.doesNotMatch(login, /demoEntryEnabled|NEXT_PUBLIC_ENABLE_DEMO/);
  assert.match(login, /\/api\/auth\/demo/);
  assert.match(button, /requestDemoEntry/);
  assert.doesNotMatch(button, /enterAsDemo\(\)/);
});
