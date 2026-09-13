"use client";

import {
  fetchBlockedIds,
  fetchServerChats,
  fetchServerConnections,
} from "@/lib/apiClient";
import {
  applyServerBlockedIds,
  applyServerChats,
  applyServerConnections,
} from "@/lib/store";

/**
 * Pull server chats / connections / blocks into localStorage.
 * Safe to call on every inbox, Circle, and Discover mount.
 */
export async function hydrateSocialCaches(): Promise<void> {
  const [chats, connections, blocked] = await Promise.all([
    fetchServerChats(),
    fetchServerConnections(),
    fetchBlockedIds(),
  ]);
  if (chats) applyServerChats(chats);
  if (connections) applyServerConnections(connections);
  if (blocked) applyServerBlockedIds(blocked);
}
