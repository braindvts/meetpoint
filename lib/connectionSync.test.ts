import assert from "node:assert/strict";
import { test } from "node:test";
import {
  collapseConnections,
  planConnectionRequest,
  preferConnection,
} from "./connectionSync.ts";
import type { Connection } from "./types.ts";

function row(
  peerId: string,
  status: Connection["status"],
  direction: Connection["direction"]
): Connection {
  return { peerId, status, direction };
}

test("inbound request wins over a duplicate outbound request", () => {
  const picked = preferConnection([
    row("p1", "requested", "out"),
    row("p1", "requested", "in"),
  ]);
  assert.equal(picked?.direction, "in");
  assert.equal(picked?.status, "requested");
});

test("connected wins over any pending request", () => {
  assert.equal(
    preferConnection([row("p1", "requested", "in"), row("p1", "connected", "out")])?.status,
    "connected"
  );
});

test("collapse keeps one row per peer", () => {
  const rows = collapseConnections([
    row("a", "requested", "out"),
    row("a", "requested", "in"),
    row("b", "connected", "out"),
  ]);
  assert.equal(rows.length, 2);
  assert.equal(rows.find((r) => r.peerId === "a")?.direction, "in");
});

test("connect accepts an existing inbound request", () => {
  assert.equal(
    planConnectionRequest(
      [{ fromId: "them", toId: "me", status: "requested" }],
      "me",
      "them"
    ),
    "accept"
  );
});

test("connect does not stack a second request when already connected", () => {
  assert.equal(
    planConnectionRequest(
      [{ fromId: "me", toId: "them", status: "connected" }],
      "me",
      "them"
    ),
    "noop"
  );
});

test("connect requests when no row exists", () => {
  assert.equal(planConnectionRequest([], "me", "them"), "request");
});
