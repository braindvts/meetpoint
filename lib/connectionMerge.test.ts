import assert from "node:assert/strict";
import { test } from "node:test";
import { DEMO_PEOPLE } from "./demoPeople.ts";
import { mergeServerConnections } from "./connectionMerge.ts";
import { tierForPerson } from "./tiers.ts";
import type { Connection, ReputationSummary } from "./types.ts";

const emptyRep = (peerId: string): ReputationSummary => ({
  peerId,
  ratingCount: 0,
  showedUpRate: 0,
  professionalRate: 0,
  valuableRate: 0,
  wouldMeetAgainRate: 0,
  score: 0,
  status: "standing",
});

test("server connections stay, and sample peers are not dropped", () => {
  const local: Connection[] = [
    { peerId: "p1", status: "requested", direction: "out" },
    { peerId: "real-old", status: "connected", direction: "out" },
  ];
  const remote: Connection[] = [
    { peerId: "real-new", status: "connected", direction: "in" },
  ];
  const merged = mergeServerConnections(local, remote, (id) => id.startsWith("p"));
  assert.deepEqual(
    merged.map((c) => c.peerId),
    ["real-new", "p1"]
  );
});

test("a sample peer already on the server uses the server row", () => {
  const local: Connection[] = [{ peerId: "p1", status: "connected", direction: "out" }];
  const remote: Connection[] = [{ peerId: "p1", status: "requested", direction: "out" }];
  const merged = mergeServerConnections(local, remote, () => true);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].status, "requested");
});

test("sample room includes Members, Verified, and BLACK", () => {
  const standing = DEMO_PEOPLE.map((person) => tierForPerson(person, emptyRep(person.id)));
  assert.ok(standing.filter((tier) => tier === 1).length >= 4);
  assert.ok(standing.filter((tier) => tier === 2).length >= 4);
  assert.ok(standing.filter((tier) => tier === 3).length >= 2);
  const marcus = DEMO_PEOPLE.find((person) => person.id === "p1");
  assert.equal(marcus?.name, "Marcus Reid");
  assert.equal(tierForPerson(marcus!, emptyRep("p1")), 1);
});
