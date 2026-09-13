/**
 * Unread chat counts — red badge for incoming texts you haven’t opened yet.
 */

import type { GroupChat } from "./types";

const READ_KEY = "meetpoint.chat.read";
const ACTIVE_KEY = "meetpoint.activeChatId";

type ReadMap = Record<string, string>; // chatId -> lastReadMessageId

function readMap(): ReadMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(READ_KEY);
    return raw ? (JSON.parse(raw) as ReadMap) : {};
  } catch {
    return {};
  }
}

function writeMap(map: ReadMap) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(READ_KEY, JSON.stringify(map));
  } catch {
    /* quota */
  }
  window.dispatchEvent(new CustomEvent("meetpoint:unread-changed"));
}

export function setActiveChatId(chatId: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (chatId) sessionStorage.setItem(ACTIVE_KEY, chatId);
    else sessionStorage.removeItem(ACTIVE_KEY);
  } catch {
    /* ignore */
  }
}

export function getActiveChatId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

function isIncoming(senderId: string) {
  return senderId !== "me" && senderId !== "system";
}

/** Count unread peer messages in one chat. */
export function unreadCountForChat(chat: GroupChat): number {
  const lastRead = readMap()[chat.id];
  if (!lastRead) {
    // No baseline yet — don’t badge historical threads
    return 0;
  }
  let seen = false;
  let count = 0;
  for (const m of chat.messages) {
    if (!seen) {
      if (m.id === lastRead) seen = true;
      continue;
    }
    if (isIncoming(m.senderId)) count += 1;
  }
  // If lastRead id was missing (stale), treat as fully read until next open
  if (!seen) {
    return 0;
  }
  return count;
}

export function totalUnread(chats: GroupChat[]): number {
  return chats.reduce((n, c) => n + unreadCountForChat(c), 0);
}

/**
 * First visit: treat existing messages as already seen so badges only
 * show for new incoming texts going forward.
 */
/** Keep unread cursor when a local chat id is replaced by the server id. */
export function remapChatReadCursor(from: string, to: string): void {
  if (!from || !to || from === to) return;
  const map = readMap();
  if (map[from] && !map[to]) {
    map[to] = map[from];
    delete map[from];
    writeMap(map);
  }
}

export function ensureReadBaseline(chats: GroupChat[]): void {
  const map = readMap();
  let changed = false;
  for (const c of chats) {
    if (map[c.id]) continue;
    const last = c.messages[c.messages.length - 1];
    if (!last) continue;
    map[c.id] = last.id;
    changed = true;
  }
  if (changed) writeMap(map);
}

/** Mark everything in this thread as read up to the latest message. */
export function markChatRead(chat: GroupChat): void {
  const last = chat.messages[chat.messages.length - 1];
  const map = readMap();
  if (!last) {
    delete map[chat.id];
  } else {
    map[chat.id] = last.id;
  }
  writeMap(map);
}

/**
 * After a peer message lands: if the user isn’t viewing that thread,
 * keep unread and fire a browser notification.
 */
export function noteIncomingMessage(opts: {
  chatId: string;
  messageId: string;
  preview: string;
  title: string;
}): void {
  if (typeof window === "undefined") return;
  if (getActiveChatId() === opts.chatId) {
    // Viewer is in the thread — treat as read when chats refresh
    return;
  }
  window.dispatchEvent(new CustomEvent("meetpoint:unread-changed"));
  void import("./chatMute").then(({ isChatMuted }) => {
    if (isChatMuted(opts.chatId)) return;
    void import("./notify").then(({ pushAppNotification }) =>
      pushAppNotification(opts.title, opts.preview, {
        url: `/chats?c=${encodeURIComponent(opts.chatId)}`,
        tag: `chat-${opts.chatId}`,
      })
    );
  });
}
