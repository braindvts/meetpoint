/**
 * Server-enforced page size for member lists.
 * Callers may ask for a smaller page. They cannot ask for the whole table.
 */
export const MEMBER_PAGE_DEFAULT = 50;
export const MEMBER_PAGE_MAX = 100;

/** Stop a client walk if cursors never end. 500 pages × 100 is 50,000 members. */
export const MEMBER_PAGE_WALK_LIMIT = 500;

const CURSOR_RE = /^[A-Za-z0-9_-]{1,64}$/;

export function clampMemberPageSize(raw: unknown): number {
  if (raw == null || raw === "") return MEMBER_PAGE_DEFAULT;
  const text = typeof raw === "number" ? String(raw) : String(raw).trim();
  if (!text) return MEMBER_PAGE_DEFAULT;
  const n = Number(text);
  if (!Number.isFinite(n)) return MEMBER_PAGE_DEFAULT;
  const whole = Math.floor(n);
  if (whole < 1) return MEMBER_PAGE_DEFAULT;
  return Math.min(whole, MEMBER_PAGE_MAX);
}

/** A usable member id cursor, or null when the value is missing or not an id. */
export function memberPageCursor(raw: unknown): string | null {
  if (raw == null) return null;
  const value = String(raw).trim();
  if (!value) return null;
  if (!CURSOR_RE.test(value)) return null;
  return value;
}

export function memberPageQuery(url: string): {
  limit: number;
  cursor: string | null;
  cursorRejected: boolean;
} {
  const params = new URL(url).searchParams;
  const rawCursor = params.get("cursor");
  const cursor = memberPageCursor(rawCursor);
  const cursorRejected = Boolean(rawCursor && rawCursor.trim() && !cursor);
  return {
    limit: clampMemberPageSize(params.get("limit")),
    cursor,
    cursorRejected,
  };
}

/**
 * Slice an already-ranked list. `cursor` is the id of the last row on the
 * previous page. An unknown cursor yields an empty page so a client stops
 * instead of restarting at the top.
 */
export function pageAfterId<T>(
  items: readonly T[],
  idOf: (item: T) => string,
  cursor: string | null,
  limit: number
): { page: T[]; nextCursor: string | null } {
  const size = clampMemberPageSize(limit);
  let start = 0;
  if (cursor) {
    const idx = items.findIndex((item) => idOf(item) === cursor);
    if (idx < 0) return { page: [], nextCursor: null };
    start = idx + 1;
  }
  const page = items.slice(start, start + size);
  const more = start + page.length < items.length;
  const last = page[page.length - 1];
  return { page, nextCursor: more && last ? idOf(last) : null };
}

type PagePayload = {
  ok?: boolean;
  nextCursor?: unknown;
};

/**
 * Follow `nextCursor` until the server says the list is done.
 * Each request asks for the hard cap; the server still clamps it.
 * `requireComplete` returns null when a later page fails, so a caller
 * does not treat a short list as the full directory.
 */
export async function fetchMemberPages<T>(
  path: string,
  readItems: (data: PagePayload & Record<string, unknown>) => T[] | null,
  init?: RequestInit,
  opts?: { requireComplete?: boolean }
): Promise<T[] | null> {
  const items: T[] = [];
  const seenCursors = new Set<string>();
  let cursor: string | null = null;
  for (let i = 0; i < MEMBER_PAGE_WALK_LIMIT; i++) {
    const params = new URLSearchParams();
    params.set("limit", String(MEMBER_PAGE_MAX));
    if (cursor) params.set("cursor", cursor);
    const sep = path.includes("?") ? "&" : "?";
    let res: Response;
    let data: PagePayload & Record<string, unknown>;
    try {
      res = await fetch(`${path}${sep}${params}`, init);
      data = (await res.json()) as PagePayload & Record<string, unknown>;
    } catch {
      return opts?.requireComplete || items.length === 0 ? null : items;
    }
    if (!res.ok || data.ok !== true) {
      return opts?.requireComplete || items.length === 0 ? null : items;
    }
    const batch = readItems(data);
    if (!batch) return opts?.requireComplete || items.length === 0 ? null : items;
    items.push(...batch);
    const next = memberPageCursor(data.nextCursor);
    if (!next || seenCursors.has(next)) return items;
    seenCursors.add(next);
    cursor = next;
  }
  return opts?.requireComplete ? null : items;
}
