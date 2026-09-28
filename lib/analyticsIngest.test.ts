import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ANALYTICS_RATE_LIMIT,
  handleAnalyticsPost,
  type AnalyticsRow,
} from "./analyticsIngest.ts";

function request(ip: string, body: unknown, ua = "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/120.0.0.0"): Request {
  return new Request("https://interlink.test/api/analytics", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
      "user-agent": ua,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const click = {
  name: "partner_click",
  path: "/",
  meta: { partner: "edgeable", placement: "featured" },
};

test("partner click is stored without email or ip", async () => {
  const rows: AnalyticsRow[] = [];
  let lookedUp = false;
  const result = await handleAnalyticsPost(request("203.0.113.10", click), {
    memberId: async () => {
      lookedUp = true;
      return "mem_123";
    },
    create: async (row) => {
      rows.push(row);
    },
  });
  assert.equal(result.status, 200);
  assert.equal(result.body.ok, true);
  assert.equal(lookedUp, true);
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.name, "partner_click");
  assert.equal(rows[0]?.memberId, "mem_123");
  assert.deepEqual(JSON.parse(rows[0]?.metaJson || "{}"), {
    partner: "edgeable",
    placement: "featured",
  });
  assert.equal(JSON.stringify(rows[0]).includes("203.0.113.10"), false);
  assert.equal(JSON.stringify(rows[0]).includes("@"), false);
});

test("click ingest rejects unknown partners, placements, signups, and emails", async () => {
  const cases = [
    { ...click, meta: { partner: "not-a-partner", placement: "landing" } },
    { ...click, meta: { partner: "bijuuflow", placement: "footer" } },
    { ...click, meta: { partner: "onyx", placement: "landing", email: "a@b.co" } },
    { name: "signup", path: "/login" },
    { name: "pageview", path: "/user/a@b.co" },
    { name: "pageview", path: "https://evil.example/phish" },
    { name: "junk_event", path: "/" },
  ];
  for (const [index, body] of cases.entries()) {
    let wrote = false;
    const result = await handleAnalyticsPost(request(`203.0.113.${20 + index}`, body), {
      create: async () => {
        wrote = true;
      },
    });
    assert.equal(result.status, 400, JSON.stringify(body));
    assert.equal(wrote, false);
  }
});

test("obvious bots are ignored and not stored", async () => {
  let wrote = false;
  const result = await handleAnalyticsPost(
    request("203.0.113.50", { name: "pageview", path: "/" }, "Mozilla/5.0 (compatible; Googlebot/2.1)"),
    {
      create: async () => {
        wrote = true;
      },
    }
  );
  assert.equal(result.status, 200);
  assert.equal(result.body.ignored, true);
  assert.equal(wrote, false);
});

test("page views are accepted and extra junk is refused", async () => {
  const rows: AnalyticsRow[] = [];
  const ok = await handleAnalyticsPost(request("203.0.113.60", { name: "pageview", path: "/discover" }), {
    create: async (row) => {
      rows.push(row);
    },
  });
  assert.equal(ok.status, 200);
  assert.equal(rows[0]?.metaJson, "{}");
  assert.equal(rows[0]?.path, "/discover");

  const bad = await handleAnalyticsPost(
    request("203.0.113.61", { name: "pageview", path: "/discover", meta: { partner: "onyx" } }),
    { create: async () => undefined }
  );
  assert.equal(bad.status, 400);
});

test("ingest rate limit drops spam before it is stored", async () => {
  let writes = 0;
  const ip = "198.51.100.77";
  let lastStatus = 0;
  for (let i = 0; i < ANALYTICS_RATE_LIMIT + 1; i += 1) {
    const result = await handleAnalyticsPost(request(ip, { name: "pageview", path: "/events" }), {
      create: async () => {
        writes += 1;
      },
    });
    lastStatus = result.status;
  }
  assert.equal(lastStatus, 429);
  assert.equal(writes, ANALYTICS_RATE_LIMIT);
});
