import type { Connection } from "./types";

/**
 * Server rows are the source of truth for real members.
 * Sample peers never exist in the database — keep their local introduction
 * so a refresh does not undo Connect.
 */
export function mergeServerConnections(
  local: Connection[],
  remote: Connection[],
  keepPeer: (peerId: string) => boolean
): Connection[] {
  const remoteIds = new Set(remote.map((c) => c.peerId));
  const kept = local.filter((c) => keepPeer(c.peerId) && !remoteIds.has(c.peerId));
  if (!kept.length) return remote;
  return [...remote, ...kept];
}
