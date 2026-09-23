/**
 * Per-chat mute preferences — local for now (API-ready later).
 * Mute suppresses push/browser notifications; unread badges still update.
 */

const MUTE_KEY = "meetpoint.chat.muted";

type MuteMap = Record<string, true>;

function readMuted(): MuteMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(MUTE_KEY);
    return raw ? (JSON.parse(raw) as MuteMap) : {};
  } catch {
    return {};
  }
}

function writeMuted(map: MuteMap) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MUTE_KEY, JSON.stringify(map));
  } catch {
    /* quota */
  }
  window.dispatchEvent(new CustomEvent("meetpoint:mute-changed"));
}

export function isChatMuted(chatId: string): boolean {
  return !!readMuted()[chatId];
}

export function setChatMuted(chatId: string, muted: boolean): void {
  const map = readMuted();
  if (muted) map[chatId] = true;
  else delete map[chatId];
  writeMuted(map);
}

export function toggleChatMuted(chatId: string): boolean {
  const next = !isChatMuted(chatId);
  setChatMuted(chatId, next);
  return next;
}

/** Keep mute when a local thread id is replaced by the server id. */
export function remapChatMute(fromId: string, toId: string): void {
  if (!fromId || !toId || fromId === toId) return;
  if (!isChatMuted(fromId)) return;
  setChatMuted(toId, true);
  setChatMuted(fromId, false);
}

/** Drop mute when a chat is deleted / left. */
export function clearChatMute(chatId: string): void {
  if (!isChatMuted(chatId)) return;
  setChatMuted(chatId, false);
}
