import assert from "node:assert/strict";
import { test } from "node:test";
import { EVENTS, formatEventDate } from "./events.ts";
import {
  applyNoticeRefresh,
  emptyNoticeSnapshot,
  pickEventNotices,
  unreadCount,
  withAllRead,
  withCleared,
  withNoticeRead,
  type EventNoticeInput,
  type NoticeState,
} from "./notifications.ts";

const NOW = Date.parse("2026-09-23T15:00:00Z");

function toInput(id: string): EventNoticeInput {
  const event = EVENTS.find((row) => row.id === id);
  if (!event) throw new Error(id);
  return {
    id: event.id,
    name: event.name,
    kind: event.kind,
    category: event.category,
    city: event.city,
    venue: event.venue,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    published: event.published,
    dateLabel: formatEventDate(event.startsAt),
    image: event.image,
  };
}

const CATALOG = EVENTS.map((event) => toInput(event.id));

function refresh(
  state: NoticeState,
  input: Partial<Parameters<typeof applyNoticeRefresh>[1]> = {}
): NoticeState {
  return applyNoticeRefresh(state, {
    connections: [],
    names: {},
    events: CATALOG,
    now: NOW,
    ...input,
  });
}

test("first snapshot does not backfill acceptances that already happened", () => {
  const next = refresh(emptyNoticeSnapshot(), {
    connections: [{ peerId: "p1", status: "connected", direction: "out" }],
    names: { p1: "Marcus Reid" },
  });
  assert.equal(next.connBaselined, true);
  assert.equal(next.items.some((item) => item.kind === "connection_accepted"), false);
});

test("an outbound request that becomes accepted is one unread item", () => {
  const baseline = refresh(emptyNoticeSnapshot(), {
    connections: [{ peerId: "p1", status: "requested", direction: "out" }],
    names: { p1: "Marcus Reid" },
  });
  const accepted = refresh(baseline, {
    connections: [{ peerId: "p1", status: "connected", direction: "out" }],
    names: { p1: "Marcus Reid" },
  });
  const again = refresh(accepted, {
    connections: [{ peerId: "p1", status: "connected", direction: "out" }],
    names: { p1: "Marcus Reid" },
  });
  const rows = again.items.filter((item) => item.kind === "connection_accepted");
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.title, "Marcus accepted your introduction");
  assert.equal(rows[0]?.href, "/chats");
  assert.equal(rows[0]?.read, false);
  assert.equal(rows[0]?.eyebrow, "Connection");
});

test("accepting someone else's request does not notify you", () => {
  const baseline = refresh(emptyNoticeSnapshot(), {
    connections: [{ peerId: "p2", status: "requested", direction: "in" }],
  });
  const accepted = refresh(baseline, {
    connections: [{ peerId: "p2", status: "connected", direction: "in" }],
    names: { p2: "Amina Shah" },
  });
  assert.equal(accepted.items.some((item) => item.kind === "connection_accepted"), false);
});

test("a profile city uses the catalog city string, and still includes a convention", () => {
  const next = refresh(emptyNoticeSnapshot(), { city: "New York" });
  const events = next.items.filter((item) => item.kind === "event");
  const ids = events.map((item) => item.dedupeKey);
  assert.deepEqual(ids, ["event:evt-black-tie-ny", "event:evt-invest-nyc", "event:evt-tech-austin"]);
  assert.equal(events[0]?.eyebrow, "In New York");
  assert.match(events[0]?.body || "", /The Modern/);
  assert.equal(events[0]?.image, "/events/founders-table-midtown.jpg");
  assert.ok(events.every((item) => item.image?.startsWith("/events/")));
  assert.equal(events[2]?.eyebrow, "Upcoming convention");
  assert.match(events[2]?.body || "", /Austin/);
  for (const item of events) {
    assert.doesNotMatch(item.eyebrow, /Nearby/i);
    assert.doesNotMatch(item.body, /Nearby/i);
  }
});

test("without a city, upcoming rows stay upcoming and include a convention", () => {
  const picked = pickEventNotices(CATALOG, undefined, NOW);
  assert.equal(picked.length, 4);
  assert.equal(picked.some((row) => row.event.kind === "convention"), true);
  assert.equal(picked.every((row) => row.placement === "upcoming"), true);
  const next = refresh(emptyNoticeSnapshot(), { city: "" });
  assert.equal(
    next.items.some((item) => item.eyebrow === "Upcoming convention"),
    true
  );
});

test("a later calendar drops gatherings that already ended", () => {
  const later = Date.parse("2030-01-01T00:00:00Z");
  const next = refresh(emptyNoticeSnapshot(), { now: later, city: "New York" });
  assert.equal(next.items.length, 0);
});

test("mark read clears the badge and clear keeps items from coming back", () => {
  const seeded = refresh(emptyNoticeSnapshot(), { city: "Chicago" });
  assert.ok(unreadCount(seeded) > 0);
  const read = withAllRead(seeded);
  assert.equal(unreadCount(read), 0);
  assert.ok(read.items.length > 0);
  const one = withNoticeRead(seeded, seeded.items[0]!.id);
  assert.equal(one.items[0]?.read, true);

  const cleared = withCleared(seeded);
  assert.equal(cleared.items.length, 0);
  const again = refresh(cleared, { city: "Chicago" });
  assert.equal(again.items.length, 0);
});

test("a new request after a cleared acceptance can notify again", () => {
  let state = refresh(emptyNoticeSnapshot(), {
    connections: [{ peerId: "p1", status: "requested", direction: "out" }],
    names: { p1: "Marcus Reid" },
  });
  state = refresh(state, {
    connections: [{ peerId: "p1", status: "connected", direction: "out" }],
    names: { p1: "Marcus Reid" },
  });
  state = withCleared(state);
  state = refresh(state, {
    connections: [{ peerId: "p1", status: "requested", direction: "out" }],
    names: { p1: "Marcus Reid" },
  });
  state = refresh(state, {
    connections: [{ peerId: "p1", status: "connected", direction: "out" }],
    names: { p1: "Marcus Reid" },
  });
  const rows = state.items.filter((item) => item.dedupeKey === "conn:p1");
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.read, false);
});
