/**
 * In-app notification feed. Stored in this browser — there is no notifications table.
 * Connection rows appear only when an outbound request becomes accepted.
 * Event rows reuse the published catalog: "In {city}" when the profile city
 * matches the event city string, otherwise "Upcoming". No geo radius.
 */

export const NOTIFICATIONS_KEY = "meetpoint.notifications";

export type NoticeKind = "connection_accepted" | "event";

export interface Notice {
  id: string;
  kind: NoticeKind;
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  createdAt: string;
  /** Connections sort by arrival; events sort by start time. */
  sortAt: string;
  read: boolean;
  dedupeKey: string;
}

export interface NoticeState {
  connSeen: Record<string, "requested" | "connected">;
  connBaselined: boolean;
  dismissed: string[];
  readKeys: string[];
  items: Notice[];
}

export interface ConnectionSnap {
  peerId: string;
  status: "requested" | "connected";
  direction?: "in" | "out";
}

/** Minimal event shape so this module does not import the catalog. */
export interface EventNoticeInput {
  id: string;
  name: string;
  kind: "event" | "convention";
  category: string;
  city: string;
  venue: string;
  startsAt: string;
  endsAt: string;
  published?: boolean;
  dateLabel: string;
}

export interface NoticeRefreshInput {
  connections: ConnectionSnap[];
  names: Record<string, string>;
  events: EventNoticeInput[];
  city?: string;
  now?: number;
}

const EMPTY: NoticeState = {
  connSeen: {},
  connBaselined: false,
  dismissed: [],
  readKeys: [],
  items: [],
};

const MAX_EVENTS = 4;
const MAX_LOCAL = 3;
const MAX_MEMORY = 200;

let cachedRaw: string | null = null;
let cachedState: NoticeState = EMPTY;

function emptyState(): NoticeState {
  return {
    connSeen: {},
    connBaselined: false,
    dismissed: [],
    readKeys: [],
    items: [],
  };
}

export function unreadCount(state: NoticeState): number {
  return state.items.reduce((n, item) => n + (item.read ? 0 : 1), 0);
}

function isConvention(event: EventNoticeInput): boolean {
  return event.kind === "convention" || event.category === "convention";
}

/** Same city-string signal Events already uses. Country is ignored on purpose. */
export function eventMatchesCity(event: EventNoticeInput, city: string): boolean {
  const q = city.trim().toLowerCase();
  if (!q) return false;
  const name = event.city.trim().toLowerCase();
  return name === q || name.includes(q);
}

export function pickEventNotices(
  events: EventNoticeInput[],
  city: string | undefined,
  now: number
): { event: EventNoticeInput; placement: "city" | "upcoming" }[] {
  const upcoming = events
    .filter((event) => {
      if (event.published === false) return false;
      const end = new Date(event.endsAt).getTime();
      return Number.isFinite(end) && end >= now;
    })
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

  const local = city ? upcoming.filter((event) => eventMatchesCity(event, city)) : [];
  const chosen: { event: EventNoticeInput; placement: "city" | "upcoming" }[] = [];
  const ids = new Set<string>();

  const push = (event: EventNoticeInput, placement: "city" | "upcoming") => {
    if (ids.has(event.id) || chosen.length >= MAX_EVENTS) return;
    ids.add(event.id);
    chosen.push({ event, placement });
  };

  for (const event of local.slice(0, MAX_LOCAL)) push(event, "city");

  const convention = upcoming.find((event) => isConvention(event));
  if (convention) {
    const placement = city && eventMatchesCity(convention, city) ? "city" : "upcoming";
    push(convention, placement);
  }

  if (!local.length) {
    for (const event of upcoming) push(event, "upcoming");
  }

  chosen.sort(
    (a, b) => new Date(a.event.startsAt).getTime() - new Date(b.event.startsAt).getTime()
  );
  return chosen;
}

function eventEyebrow(event: EventNoticeInput, placement: "city" | "upcoming"): string {
  if (placement === "city") {
    return isConvention(event) ? `In ${event.city} · Convention` : `In ${event.city}`;
  }
  return isConvention(event) ? "Upcoming convention" : "Upcoming";
}

function firstName(name: string | undefined): string {
  const trimmed = name?.trim();
  if (!trimmed) return "Someone";
  return trimmed.split(/\s+/)[0] || "Someone";
}

function connectionTitle(name: string | undefined): string {
  return `${firstName(name)} accepted your introduction`;
}

function outboundStatus(
  connections: ConnectionSnap[]
): Map<string, "requested" | "connected"> {
  const map = new Map<string, "requested" | "connected">();
  for (const row of connections) {
    if (row.direction === "in") continue;
    const prev = map.get(row.peerId);
    if (!prev || row.status === "connected") map.set(row.peerId, row.status);
  }
  return map;
}

function capList(values: string[]): string[] {
  if (values.length <= MAX_MEMORY) return values;
  return values.slice(values.length - MAX_MEMORY);
}

function sortNotices(items: Notice[]): Notice[] {
  return [...items].sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1;
    if (a.kind !== b.kind) return a.kind === "connection_accepted" ? -1 : 1;
    if (a.kind === "event") return a.sortAt.localeCompare(b.sortAt);
    return b.createdAt.localeCompare(a.createdAt);
  });
}

function syncConnections(
  state: NoticeState,
  connections: ConnectionSnap[],
  names: Record<string, string>,
  nowIso: string
): NoticeState {
  const current = outboundStatus(connections);
  const connSeen = { ...state.connSeen };
  let items = state.items
    .filter((item) => item.kind === "connection_accepted")
    .map((item) => ({ ...item }));
  const dismissed = new Set(state.dismissed);
  const readKeys = new Set(state.readKeys);

  if (!state.connBaselined) {
    for (const [peerId, status] of current) connSeen[peerId] = status;
    return { ...state, connSeen, connBaselined: true, items: state.items };
  }

  for (const [peerId, status] of current) {
    const key = `conn:${peerId}`;
    const prev = connSeen[peerId];

    if (status === "requested") {
      if (prev === "connected" || items.some((item) => item.dedupeKey === key)) {
        dismissed.delete(key);
        readKeys.delete(key);
        items = items.filter((item) => item.dedupeKey !== key);
      }
      connSeen[peerId] = "requested";
      continue;
    }

    if (status === "connected" && prev === "requested" && !dismissed.has(key)) {
      if (!items.some((item) => item.dedupeKey === key)) {
        items = [
          {
            id: key,
            kind: "connection_accepted",
            eyebrow: "Connection",
            title: connectionTitle(names[peerId]),
            body: "You’re connected. Open Chats when you want to message them.",
            href: "/chats",
            createdAt: nowIso,
            sortAt: nowIso,
            read: readKeys.has(key),
            dedupeKey: key,
          },
          ...items,
        ];
      }
    }

    if (names[peerId]) {
      items = items.map((item) =>
        item.dedupeKey === key && item.title.startsWith("Someone ")
          ? { ...item, title: connectionTitle(names[peerId]) }
          : item
      );
    }

    connSeen[peerId] = "connected";
  }

  const eventItems = state.items.filter((item) => item.kind === "event");
  return {
    ...state,
    connSeen,
    connBaselined: true,
    dismissed: capList([...dismissed]),
    readKeys: capList([...readKeys]),
    items: [...items, ...eventItems],
  };
}

function syncEvents(
  state: NoticeState,
  events: EventNoticeInput[],
  city: string | undefined,
  now: number,
  nowIso: string
): NoticeState {
  const picked = pickEventNotices(events, city, now);
  const previous = new Map(
    state.items.filter((item) => item.kind === "event").map((item) => [item.dedupeKey, item])
  );
  const dismissed = new Set(state.dismissed);
  const readKeys = new Set(state.readKeys);
  const eventItems: Notice[] = [];

  for (const { event, placement } of picked) {
    const key = `event:${event.id}`;
    if (dismissed.has(key)) continue;
    const prior = previous.get(key);
    eventItems.push({
      id: key,
      kind: "event",
      eyebrow: eventEyebrow(event, placement),
      title: event.name,
      body:
        placement === "city"
          ? `${event.dateLabel} · ${event.venue}`
          : `${event.dateLabel} · ${event.city}`,
      href: `/events/${event.id}`,
      createdAt: prior?.createdAt || nowIso,
      sortAt: event.startsAt,
      read: readKeys.has(key),
      dedupeKey: key,
    });
  }

  const connections = state.items.filter((item) => item.kind === "connection_accepted");
  return {
    ...state,
    items: sortNotices([...connections, ...eventItems]),
  };
}

export function applyNoticeRefresh(state: NoticeState, input: NoticeRefreshInput): NoticeState {
  const now = input.now ?? Date.now();
  const nowIso = new Date(now).toISOString();
  const withConnections = syncConnections(state, input.connections, input.names, nowIso);
  return syncEvents(withConnections, input.events, input.city, now, nowIso);
}

export function withNoticeRead(state: NoticeState, id: string): NoticeState {
  const item = state.items.find((row) => row.id === id);
  if (!item || item.read) return state;
  const readKeys = state.readKeys.includes(item.dedupeKey)
    ? state.readKeys
    : [...state.readKeys, item.dedupeKey];
  return {
    ...state,
    readKeys,
    items: state.items.map((row) => (row.id === id ? { ...row, read: true } : row)),
  };
}

export function withAllRead(state: NoticeState): NoticeState {
  if (!state.items.some((item) => !item.read)) return state;
  const readKeys = new Set(state.readKeys);
  for (const item of state.items) readKeys.add(item.dedupeKey);
  return {
    ...state,
    readKeys: capList([...readKeys]),
    items: state.items.map((item) => ({ ...item, read: true })),
  };
}

export function withCleared(state: NoticeState): NoticeState {
  if (!state.items.length) return state;
  const dismissed = new Set(state.dismissed);
  for (const item of state.items) dismissed.add(item.dedupeKey);
  return {
    ...state,
    items: [],
    dismissed: capList([...dismissed]),
  };
}

function isNotice(value: unknown): value is Notice {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<Notice>;
  return (
    typeof row.id === "string" &&
    (row.kind === "connection_accepted" || row.kind === "event") &&
    typeof row.title === "string" &&
    typeof row.dedupeKey === "string"
  );
}

function parseState(raw: string | null): NoticeState {
  if (!raw) return emptyState();
  try {
    const data = JSON.parse(raw) as Partial<NoticeState>;
    const items = Array.isArray(data.items) ? data.items.filter(isNotice) : [];
    const connSeen: NoticeState["connSeen"] = {};
    if (data.connSeen && typeof data.connSeen === "object") {
      for (const [peerId, status] of Object.entries(data.connSeen)) {
        if (status === "requested" || status === "connected") connSeen[peerId] = status;
      }
    }
    return {
      connSeen,
      connBaselined: data.connBaselined === true,
      dismissed: Array.isArray(data.dismissed)
        ? data.dismissed.filter((id) => typeof id === "string")
        : [],
      readKeys: Array.isArray(data.readKeys)
        ? data.readKeys.filter((id) => typeof id === "string")
        : [],
      items: items.map((item) => ({
        id: item.id,
        kind: item.kind,
        eyebrow: typeof item.eyebrow === "string" ? item.eyebrow : "",
        title: item.title,
        body: typeof item.body === "string" ? item.body : "",
        href: typeof item.href === "string" ? item.href : "/",
        createdAt: typeof item.createdAt === "string" ? item.createdAt : "",
        sortAt: typeof item.sortAt === "string" ? item.sortAt : item.createdAt || "",
        read: item.read === true,
        dedupeKey: item.dedupeKey,
      })),
    };
  } catch {
    return emptyState();
  }
}

export function loadNoticeState(): NoticeState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    if (raw === cachedRaw) return cachedState;
    cachedRaw = raw;
    cachedState = parseState(raw);
    return cachedState;
  } catch {
    return EMPTY;
  }
}

export function emptyNoticeSnapshot(): NoticeState {
  return EMPTY;
}

function persist(state: NoticeState): NoticeState {
  if (typeof window === "undefined") return state;
  const raw = JSON.stringify(state);
  if (raw === cachedRaw) return cachedState;
  try {
    localStorage.setItem(NOTIFICATIONS_KEY, raw);
  } catch {
    return cachedState;
  }
  cachedRaw = raw;
  cachedState = state;
  window.dispatchEvent(new CustomEvent("meetpoint:notifications-changed"));
  return state;
}

export function refreshNotices(input: NoticeRefreshInput): NoticeState {
  const next = applyNoticeRefresh(loadNoticeState(), input);
  return persist(next);
}

export function markNoticeRead(id: string): NoticeState {
  return persist(withNoticeRead(loadNoticeState(), id));
}

export function markAllNoticesRead(): NoticeState {
  return persist(withAllRead(loadNoticeState()));
}

export function clearNotices(): NoticeState {
  return persist(withCleared(loadNoticeState()));
}

export function clearNoticeStore(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(NOTIFICATIONS_KEY);
  } catch {
    /* ignore */
  }
  cachedRaw = null;
  cachedState = emptyState();
  window.dispatchEvent(new CustomEvent("meetpoint:notifications-changed"));
}

export function subscribeNotices(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onChange = () => listener();
  window.addEventListener("meetpoint:notifications-changed", onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener("meetpoint:notifications-changed", onChange);
    window.removeEventListener("storage", onChange);
  };
}
