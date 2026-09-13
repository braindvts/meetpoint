import type { EventInterest, EventInterestStatus } from "./eventTypes";

const KEY = "meetpoint.event-interests";

export function loadEventInterests(): EventInterest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as EventInterest[]) : [];
    return Array.isArray(parsed)
      ? parsed.filter((r) => r && typeof r.eventId === "string" && typeof r.status === "string")
      : [];
  } catch {
    return [];
  }
}

export function saveEventInterests(rows: EventInterest[]): EventInterest[] {
  if (typeof window === "undefined") return rows;
  try {
    localStorage.setItem(KEY, JSON.stringify(rows));
  } catch {
    /* ignore quota */
  }
  window.dispatchEvent(new CustomEvent("meetpoint:events-changed"));
  return rows;
}

export function setEventInterest(eventId: string, status: EventInterestStatus): EventInterest[] {
  const next = loadEventInterests().filter((r) => r.eventId !== eventId);
  next.push({ eventId, status });
  return saveEventInterests(next);
}

export function clearEventInterest(eventId: string): EventInterest[] {
  return saveEventInterests(loadEventInterests().filter((r) => r.eventId !== eventId));
}

export function mergeEventInterests(server: EventInterest[]): EventInterest[] {
  const byId = new Map<string, EventInterest>();
  for (const row of loadEventInterests()) byId.set(row.eventId, row);
  for (const row of server) byId.set(row.eventId, row);
  return saveEventInterests([...byId.values()]);
}
