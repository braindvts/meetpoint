import { getPublishedEvents, type InterlinkEvent } from "./events";

/** Values written for a signed-in member. `saved` is a legacy interested row. */
export const RSVP_STATUSES = ["interested", "going", "passed"] as const;
export type StoredRsvp = (typeof RSVP_STATUSES)[number];

export function isStoredRsvp(value: string | null | undefined): value is StoredRsvp {
  return value === "interested" || value === "going" || value === "passed";
}

export function catalogEvent(eventId: string): InterlinkEvent | undefined {
  return getPublishedEvents().find((event) => event.id === eventId || event.slug === eventId);
}

export interface InterestCountRow {
  eventId: string;
  status: string;
  n: number;
}

export interface EventRsvpCounts {
  interested: number;
  attending: number;
}

/** Fold EventInterest rows into interested / attending totals. `saved` counts as interested. */
export function foldInterestCounts(rows: readonly InterestCountRow[]): Record<string, EventRsvpCounts> {
  const out: Record<string, EventRsvpCounts> = {};
  for (const row of rows) {
    const slot = out[row.eventId] || { interested: 0, attending: 0 };
    const n = Number(row.n) || 0;
    if (row.status === "interested" || row.status === "saved") slot.interested += n;
    else if (row.status === "going") slot.attending += n;
    out[row.eventId] = slot;
  }
  return out;
}

/** Replace catalog mock totals with database counts. Missing rows are zero. */
export function applyRsvpCounts(
  events: readonly InterlinkEvent[],
  counts: Record<string, EventRsvpCounts>
): InterlinkEvent[] {
  return events.map((event) => {
    const row = counts[event.id] || { interested: 0, attending: 0 };
    return {
      ...event,
      interestedCount: row.interested,
      attendeeCount: row.attending,
    };
  });
}
