/**
 * Pure safety rules. Database lookups live in lib/moderation.ts.
 * OPEN_REPORT_HIDE_THRESHOLD is the only auto-hide cutoff.
 */

export const OPEN_REPORT_HIDE_THRESHOLD = 3;

/** Reports that still count toward auto-hide. Resolved and dismissed do not. */
export const OPEN_REPORT_STATUSES = ["open", "reviewing"] as const;

export type OpenReportStatus = (typeof OPEN_REPORT_STATUSES)[number];

export function isOpenReportStatus(status: string): boolean {
  return (OPEN_REPORT_STATUSES as readonly string[]).includes(status);
}

/** Hide from Discover and For you once this many different people have an open report. */
export function shouldAutoHide(distinctOpenReporters: number): boolean {
  return distinctOpenReporters >= OPEN_REPORT_HIDE_THRESHOLD;
}

export function countDistinctReporters(
  rows: { peerId: string; reporterId: string }[]
): Map<string, number> {
  const byPeer = new Map<string, Set<string>>();
  for (const row of rows) {
    let set = byPeer.get(row.peerId);
    if (!set) {
      set = new Set();
      byPeer.set(row.peerId, set);
    }
    set.add(row.reporterId);
  }
  const counts = new Map<string, number>();
  for (const [peerId, set] of byPeer) counts.set(peerId, set.size);
  return counts;
}

export function autoHiddenFromRows(
  rows: { peerId: string; reporterId: string }[]
): Set<string> {
  const hidden = new Set<string>();
  for (const [peerId, count] of countDistinctReporters(rows)) {
    if (shouldAutoHide(count)) hidden.add(peerId);
  }
  return hidden;
}

/** Discover / For you: drop yourself, blocks (either direction), and auto-hidden members. */
export function visibleInDiscover(
  candidateIds: string[],
  viewerId: string,
  blockedIds: ReadonlySet<string>,
  autoHiddenIds: ReadonlySet<string>
): string[] {
  return candidateIds.filter(
    (id) => id !== viewerId && !blockedIds.has(id) && !autoHiddenIds.has(id)
  );
}

export function filterAttendeeIds(
  attendeeIds: string[],
  blockedIds: ReadonlySet<string>
): string[] {
  return attendeeIds.filter((id) => !blockedIds.has(id));
}

/** A chat is unavailable when any other participant is in a block pair with the viewer. */
export function chatInvolvesBlock(
  otherMemberIds: string[],
  blockedIds: ReadonlySet<string>
): boolean {
  return otherMemberIds.some((id) => blockedIds.has(id));
}

/**
 * A signed-in OAuth/email session must never be fulfilled by a different
 * member cookie left on the same browser.
 */
export function memberAuthSource(
  hasSession: boolean,
  sessionMatched: boolean,
  hasCookie: boolean
): "session" | "cookie" | "none" {
  if (hasSession) return sessionMatched ? "session" : "none";
  if (hasCookie) return "cookie";
  return "none";
}

type Bucket = { count: number; resetAt: number };

/** Fixed window used by both the memory fallback and tests. */
export function consumeBucket(
  buckets: Map<string, Bucket>,
  key: string,
  limit: number,
  windowMs: number,
  now: number
): { allowed: boolean; count: number; retryAfterSec: number } {
  let row = buckets.get(key);
  if (!row || now >= row.resetAt) {
    row = { count: 0, resetAt: now + windowMs };
    buckets.set(key, row);
  }
  row.count += 1;
  if (row.count > limit) {
    return {
      allowed: false,
      count: row.count,
      retryAfterSec: Math.max(1, Math.ceil((row.resetAt - now) / 1000)),
    };
  }
  return { allowed: true, count: row.count, retryAfterSec: 0 };
}
