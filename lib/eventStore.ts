/**
 * Client-side event state: interested / attending RSVPs + admin overlay CRUD.
 * Base catalog lives in lib/events.ts; this layer is localStorage until a real API exists.
 */

import {
  EVENTS,
  type InterlinkEvent,
  getPublishedEvents as basePublished,
} from "./events";

const RSVP_KEY = "meetpoint.event.rsvp";
const OVERLAY_KEY = "meetpoint.event.overlay";

export type EventRsvp = "interested" | "going" | null;

type RsvpMap = Record<string, EventRsvp>;

type OverlayState = {
  /** Full replacements / new events keyed by id */
  byId: Record<string, InterlinkEvent>;
  /** Soft-deleted catalog ids */
  deleted: string[];
};

function emptyOverlay(): OverlayState {
  return { byId: {}, deleted: [] };
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota */
  }
}

export function loadRsvps(): RsvpMap {
  return readJson<RsvpMap>(RSVP_KEY, {});
}

export function getRsvp(eventId: string): EventRsvp {
  return loadRsvps()[eventId] ?? null;
}

export function setRsvp(eventId: string, status: EventRsvp): RsvpMap {
  const map = { ...loadRsvps() };
  if (!status) delete map[eventId];
  else map[eventId] = status;
  writeJson(RSVP_KEY, map);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("meetpoint:events"));
  }
  return map;
}

function loadOverlay(): OverlayState {
  const o = readJson<OverlayState>(OVERLAY_KEY, emptyOverlay());
  return {
    byId: o.byId || {},
    deleted: Array.isArray(o.deleted) ? o.deleted : [],
  };
}

function saveOverlay(o: OverlayState) {
  writeJson(OVERLAY_KEY, o);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("meetpoint:events"));
  }
}

/** Merge catalog + admin overlay (client). SSR/base uses published catalog only. */
export function listAllEvents(): InterlinkEvent[] {
  const overlay = typeof window !== "undefined" ? loadOverlay() : emptyOverlay();
  const deleted = new Set(overlay.deleted);
  const map = new Map<string, InterlinkEvent>();

  for (const e of EVENTS) {
    if (deleted.has(e.id)) continue;
    map.set(e.id, e);
  }
  for (const e of Object.values(overlay.byId)) {
    if (deleted.has(e.id)) continue;
    map.set(e.id, e);
  }
  return Array.from(map.values());
}

export function listPublishedEvents(): InterlinkEvent[] {
  return listAllEvents().filter((e) => e.published !== false);
}

export function findEvent(idOrSlug: string): InterlinkEvent | undefined {
  return listAllEvents().find((e) => e.id === idOrSlug || e.slug === idOrSlug);
}

export function upsertEvent(event: InterlinkEvent): InterlinkEvent {
  const overlay = loadOverlay();
  overlay.byId[event.id] = event;
  overlay.deleted = overlay.deleted.filter((id) => id !== event.id);
  saveOverlay(overlay);
  return event;
}

export function deleteEvent(id: string): void {
  const overlay = loadOverlay();
  delete overlay.byId[id];
  if (!overlay.deleted.includes(id)) overlay.deleted.push(id);
  saveOverlay(overlay);
}

export function togglePublished(id: string, published: boolean): InterlinkEvent | undefined {
  const existing = findEvent(id);
  if (!existing) return undefined;
  return upsertEvent({ ...existing, published });
}

/** Effective interested/attendee counts including local RSVP bump. */
export function displayCounts(event: InterlinkEvent): {
  interested: number;
  attendees: number;
  myRsvp: EventRsvp;
} {
  const myRsvp = typeof window !== "undefined" ? getRsvp(event.id) : null;
  let interested = event.interestedCount;
  let attendees = event.attendeeCount;
  if (myRsvp === "interested") interested += 1;
  if (myRsvp === "going") attendees += 1;
  return { interested, attendees, myRsvp };
}

/** How many of the viewer’s connections are listed as attending this event. */
export function networkAttendingCount(
  event: InterlinkEvent,
  connectedPeerIds: string[]
): number {
  if (!connectedPeerIds.length || !event.attendeeIds?.length) return 0;
  const set = new Set(connectedPeerIds);
  return event.attendeeIds.filter((id) => set.has(id)).length;
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

export { basePublished };
