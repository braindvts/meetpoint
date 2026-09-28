import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { DISCOVER_RESULT_CAP, discoverCandidates, discoverMemberSelect } from "./discoverSelect.ts";
import { rankPeople } from "./peopleMatch.ts";
import {
  MEMBER_PAGE_DEFAULT,
  MEMBER_PAGE_MAX,
  clampMemberPageSize,
  memberPageCursor,
  memberPageQuery,
  pageAfterId,
} from "./memberPage.ts";

test("page size defaults to 50 and never exceeds 100", () => {
  assert.equal(clampMemberPageSize(undefined), MEMBER_PAGE_DEFAULT);
  assert.equal(clampMemberPageSize(null), 50);
  assert.equal(clampMemberPageSize(""), 50);
  assert.equal(clampMemberPageSize("   "), 50);
  assert.equal(clampMemberPageSize("0"), 50);
  assert.equal(clampMemberPageSize("-4"), 50);
  assert.equal(clampMemberPageSize("nope"), 50);
  assert.equal(clampMemberPageSize("1"), 1);
  assert.equal(clampMemberPageSize("50"), 50);
  assert.equal(clampMemberPageSize(" 80 "), 80);
  assert.equal(clampMemberPageSize("100.9"), 100);
  assert.equal(clampMemberPageSize("101"), MEMBER_PAGE_MAX);
  assert.equal(clampMemberPageSize("10000"), 100);
  assert.equal(clampMemberPageSize(Number.POSITIVE_INFINITY), 50);
});

test("cursors are member ids, not free-form offsets", () => {
  assert.equal(memberPageCursor(null), null);
  assert.equal(memberPageCursor(""), null);
  assert.equal(memberPageCursor("  "), null);
  assert.equal(memberPageCursor("clxyz123"), "clxyz123");
  assert.equal(memberPageCursor("p1"), "p1");
  assert.equal(memberPageCursor(` ${"a".repeat(64)} `), "a".repeat(64));
  assert.equal(memberPageCursor("a".repeat(65)), null);
  assert.equal(memberPageCursor("../etc/passwd"), null);
  assert.equal(memberPageCursor("id with space"), null);
  assert.equal(memberPageCursor("10000"), "10000");
  assert.equal(memberPageCursor("a/b"), null);
});

test("a rejected cursor is not treated as the first page", () => {
  const ok = memberPageQuery("https://interlink.test/api/members");
  assert.equal(ok.limit, 50);
  assert.equal(ok.cursor, null);
  assert.equal(ok.cursorRejected, false);

  const capped = memberPageQuery("https://interlink.test/api/members?limit=10000&cursor=clabc");
  assert.equal(capped.limit, 100);
  assert.equal(capped.cursor, "clabc");
  assert.equal(capped.cursorRejected, false);

  const bad = memberPageQuery("https://interlink.test/api/members?cursor=../all");
  assert.equal(bad.cursor, null);
  assert.equal(bad.cursorRejected, true);
});

test("ranked pages stay within the cap and advance by id", () => {
  const items = Array.from({ length: 120 }, (_, i) => ({ id: `m${i}` }));
  const first = pageAfterId(items, (row) => row.id, null, 10000);
  assert.equal(first.page.length, 100);
  assert.equal(first.page[0]?.id, "m0");
  assert.equal(first.page[99]?.id, "m99");
  assert.equal(first.nextCursor, "m99");

  const second = pageAfterId(items, (row) => row.id, first.nextCursor, 100);
  assert.equal(second.page.length, 20);
  assert.equal(second.page[0]?.id, "m100");
  assert.equal(second.nextCursor, null);

  const missing = pageAfterId(items, (row) => row.id, "not-in-list", 50);
  assert.deepEqual(missing.page, []);
  assert.equal(missing.nextCursor, null);

  const tail = pageAfterId(items, (row) => row.id, "m119", 50);
  assert.deepEqual(tail.page, []);
  assert.equal(tail.nextCursor, null);
});

test("deleted members never reach ranking or the recently joined fallback", () => {
  const selected = discoverCandidates([
    {
      id: "gone",
      name: "Deleted member",
      deletedAt: new Date("2026-09-28T00:00:00.000Z"),
      updatedAt: "2026-09-28T00:00:00.000Z",
    },
    { id: "blank", name: "   ", deletedAt: null, updatedAt: "2026-09-27T00:00:00.000Z" },
    {
      id: "newer",
      name: "New Person",
      deletedAt: null,
      jobTitle: "Driver",
      updatedAt: "2026-09-20T00:00:00.000Z",
    },
  ]);
  const ranked = rankPeople({ id: "me", interests: ["Artificial Intelligence"] }, selected);
  assert.deepEqual(
    ranked.map((row) => row.person.id),
    ["newer"]
  );
  assert.equal(ranked[0]?.reasons[0], "Recently joined");
});

test("discover loads ranking fields only and returns the top 100", () => {
  assert.equal(DISCOVER_RESULT_CAP, 100);
  const keys = Object.keys(discoverMemberSelect);
  for (const secret of [
    "email",
    "passwordHash",
    "phone",
    "linkedInId",
    "googleId",
    "appleId",
    "emailVerifiedAt",
  ]) {
    assert.equal(keys.includes(secret), false, secret);
  }
  for (const needed of ["id", "name", "jobTitle", "ideaTagsJson", "lookingForJson", "updatedAt", "interests"]) {
    assert.equal(keys.includes(needed), true, needed);
  }
});

test("member and discover routes page the response and keep exclusions", () => {
  const members = readFileSync(new URL("../app/api/members/route.ts", import.meta.url), "utf8");
  const discover = readFileSync(new URL("../app/api/discover/route.ts", import.meta.url), "utf8");
  const directory = readFileSync(new URL("./directory.ts", import.meta.url), "utf8");
  const client = readFileSync(new URL("./apiClient.ts", import.meta.url), "utf8");
  const page = readFileSync(new URL("../app/discover/page.tsx", import.meta.url), "utf8");

  assert.match(members, /clampMemberPageSize|memberPageQuery/);
  assert.match(members, /take: limit \+ 1/);
  assert.match(members, /nextCursor/);
  assert.match(members, /memberToPerson/);
  assert.match(members, /discoverExcludedIds/);
  assert.match(members, /sampleMemberWhere/);
  assert.doesNotMatch(members, /take:\s*200/);

  assert.match(discover, /take:\s*500/);
  assert.match(discover, /discoverMemberSelect/);
  assert.match(discover, /DISCOVER_RESULT_CAP/);
  assert.match(discover, /ranked\.slice\(0,\s*DISCOVER_RESULT_CAP\)/);
  assert.match(discover, /rankPeople/);
  assert.match(discover, /discoverExcludedIds/);
  assert.match(discover, /sampleMemberWhere/);
  assert.match(discover, /deletedAt: null/);
  assert.match(discover, /discoverCandidates/);
  assert.match(members, /deletedAt: null/);
  const rsvp = readFileSync(new URL("../app/api/events/rsvp/route.ts", import.meta.url), "utf8");
  const events = readFileSync(new URL("../app/api/events/route.ts", import.meta.url), "utf8");
  assert.match(rsvp, /deletedAt: null/);
  assert.match(events, /deletedAt: null/);
  assert.match(discover, /memberToPerson/);
  assert.doesNotMatch(discover, /email:\s*true/);
  assert.doesNotMatch(discover, /passwordHash:\s*true/);
  assert.doesNotMatch(discover, /phone:\s*true/);
  assert.doesNotMatch(discover, /include:\s*\{\s*interests:\s*true\s*\}/);

  assert.match(directory, /fetchMemberPages/);
  assert.match(client, /fetchMemberPages/);
  assert.match(page, /\/api\/discover/);
  assert.doesNotMatch(page, /fetchMemberPages/);
});
