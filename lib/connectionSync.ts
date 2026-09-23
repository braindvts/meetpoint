import type { Connection } from "./types";

/** Connected beats an inbound request, which beats an outbound request. */
function connectionRank(row: Connection): number {
  if (row.status === "connected") return 3;
  if (row.direction === "in" && row.status === "requested") return 2;
  return 1;
}

/** One row per peer so a second outbound request cannot hide Accept or Chat. */
export function preferConnection(rows: Connection[]): Connection | undefined {
  if (!rows.length) return undefined;
  return rows.reduce((best, row) =>
    connectionRank(row) > connectionRank(best) ? row : best
  );
}

export function collapseConnections(rows: Connection[]): Connection[] {
  const byPeer = new Map<string, Connection>();
  for (const row of rows) {
    const prev = byPeer.get(row.peerId);
    byPeer.set(row.peerId, prev ? preferConnection([prev, row])! : row);
  }
  return [...byPeer.values()];
}

type ConnectionRow = {
  fromId: string;
  toId: string;
  status: string;
};

/**
 * Clicking Connect when they already asked accepts that request.
 * A second outbound "requested" row never stacks on top.
 */
export function planConnectionRequest(
  rows: ConnectionRow[],
  meId: string,
  peerId: string
): "accept" | "request" | "noop" {
  const inbound = rows.find((row) => row.fromId === peerId && row.toId === meId);
  const outbound = rows.find((row) => row.fromId === meId && row.toId === peerId);
  if (inbound?.status === "connected" || outbound?.status === "connected") return "noop";
  if (inbound?.status === "requested") return "accept";
  return "request";
}
