/**
 * Event RSVPs are stored in EventInterest for a signed-in member.
 * This module caches that response and still keeps a local RSVP for signed-out guests.
 * Admin event overlays stay in localStorage.
 */

import {
  EVENTS,
  type InterlinkEvent,
  getPublishedEvents as basePublished,
} from "./events";

const RSVP_KEY = "meetpoint.event.rsvp";
const OVERLAY_KEY = "meetpoint.event.overlay";

export type EventRsvp = "interested" | "going" | "passed" | null;

type ServerCounts = { interested: number; attending: number };

/** Database totals, keyed by catalog event id. Present only after a successful load or save. */
const countOverride = new Map<string, ServerCounts>();
/** Bumped on each RSVP write so a slower catalog fetch cannot overwrite it. */
let rsvpMutation = 0;

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

function writeRsvps(map: RsvpMap) {
  writeJson(RSVP_KEY, map);
}

function rememberCounts(eventId: string, counts: ServerCounts) {
  countOverride.set(eventId, counts);
}

function paintCounts(event: InterlinkEvent): InterlinkEvent {
  const over = countOverride.get(event.id);
  if (!over) return event;
  if (event.interestedCount === over.interested && event.attendeeCount === over.attending) {
    return event;
  }
  return { ...event, interestedCount: over.interested, attendeeCount: over.attending };
}

function dispatchEvents() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("meetpoint:events"));
  }
}

/**
 * Save an RSVP for the signed-in member.
 * Writes EventInterest through PUT /api/events/rsvp.
 * A signed-out browser (the sample guest) keeps the choice locally.
 */
export async function setRsvp(
  eventId: string,
  status: EventRsvp
): Promise<{ ok: boolean; error?: string }> {
  const prev = getRsvp(eventId);
  const map = { ...loadRsvps() };
  if (!status) delete map[eventId];
  else map[eventId] = status;
  writeRsvps(map);
  const ticket = ++rsvpMutation;

  try {
    const res = await fetch("/api/events/rsvp", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, status }),
    });
    if (ticket !== rsvpMutation) return { ok: true };
    if (res.status === 401) {
      dispatchEvents();
      return { ok: true };
    }
    const data = (await res.json()) as {
      ok?: boolean;
      error?: string;
      counts?: ServerCounts;
    };
    if (!res.ok || !data.ok) {
      const revert = { ...loadRsvps() };
      if (!prev) delete revert[eventId];
      else revert[eventId] = prev;
      writeRsvps(revert);
      dispatchEvents();
      return { ok: false, error: data.error || "Could not save your RSVP" };
    }
    if (data.counts) rememberCounts(eventId, data.counts);
    dispatchEvents();
    return { ok: true };
  } catch {
    if (ticket !== rsvpMutation) return { ok: true };
    const revert = { ...loadRsvps() };
    if (!prev) delete revert[eventId];
    else revert[eventId] = prev;
    writeRsvps(revert);
    dispatchEvents();
    return { ok: false, error: "Could not save your RSVP" };
  }
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
    map.set(e.id, paintCounts(e));
  }
  for (const e of Object.values(overlay.byId)) {
    if (deleted.has(e.id)) continue;
    map.set(e.id, paintCounts(e));
  }
  return Array.from(map.values());
}

export function listPublishedEvents(): InterlinkEvent[] {
  return listAllEvents().filter((e) => e.published !== false);
}

/** Server catalog when available; local catalog + overlay otherwise. */
export async function fetchPublishedEvents(): Promise<InterlinkEvent[]> {
  const seen = rsvpMutation;
  try {
    const res = await fetch("/api/events", { credentials: "include" });
    const data = (await res.json()) as {
      ok?: boolean;
      signedIn?: boolean;
      events?: InterlinkEvent[];
      countsFromDb?: boolean;
      counts?: Record<string, ServerCounts>;
      rsvps?: Record<string, EventRsvp>;
    };
    if (data.ok && Array.isArray(data.events) && data.events.length > 0) {
      const fresh = seen === rsvpMutation;
      if (fresh && data.countsFromDb && data.counts) {
        for (const event of data.events) {
          const row = data.counts[event.id];
          countOverride.set(event.id, {
            interested: row?.interested ?? 0,
            attending: row?.attending ?? 0,
          });
        }
      }
      if (fresh && data.signedIn && data.rsvps && typeof window !== "undefined") {
        const map = loadRsvps();
        for (const event of data.events) {
          const status = data.rsvps[event.id];
          if (status === "interested" || status === "going" || status === "passed") {
            map[event.id] = status;
          } else {
            delete map[event.id];
          }
        }
        writeRsvps(map);
      }
      const overlay = typeof window !== "undefined" ? loadOverlay() : emptyOverlay();
      const deleted = new Set(overlay.deleted);
      const map = new Map<string, InterlinkEvent>();
      for (const e of data.events) {
        if (deleted.has(e.id) || e.published === false) continue;
        map.set(e.id, paintCounts(e));
      }
      for (const e of Object.values(overlay.byId)) {
        if (deleted.has(e.id) || e.published === false) continue;
        map.set(e.id, paintCounts(e));
      }
      return Array.from(map.values());
    }
  } catch {
    /* offline — use local catalog */
  }
  return listPublishedEvents();
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

/**
 * Effective interested/attendee counts.
 * Pass `local: true` only after mount. Reading localStorage during the first
 * client render disagrees with the server HTML (hydration error #418).
 */
export function displayCounts(
  event: InterlinkEvent,
  opts?: { local?: boolean }
): {
  interested: number;
  attendees: number;
  myRsvp: EventRsvp;
} {
  if (!opts?.local || typeof window === "undefined") {
    return {
      interested: event.interestedCount,
      attendees: event.attendeeCount,
      myRsvp: null,
    };
  }
  const over = countOverride.get(event.id);
  const myRsvp = getRsvp(event.id);
  let interested = over?.interested ?? event.interestedCount;
  let attendees = over?.attending ?? event.attendeeCount;
  // Server totals already include this member. Only the signed-out cache adds one.
  if (!over) {
    if (myRsvp === "interested") interested += 1;
    if (myRsvp === "going") attendees += 1;
  }
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
