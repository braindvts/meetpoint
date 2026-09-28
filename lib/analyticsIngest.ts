import { FEATURED_PARTNERS } from "./featuredPartners";
import { rateLimit } from "./rateLimit";

/** Per-IP cap for the public ingest route. Counted in memory only — never stored. */
export const ANALYTICS_RATE_LIMIT = 60;
export const ANALYTICS_RATE_WINDOW_MS = 60_000;

export const PARTNER_PLACEMENTS = ["landing", "loading", "featured"] as const;
export type PartnerPlacement = (typeof PARTNER_PLACEMENTS)[number];

export const PLACEMENT_LABEL: Record<PartnerPlacement, string> = {
  landing: "Landing row",
  loading: "Loading screen",
  featured: "Featured card",
};

const PARTNER_IDS = new Set(FEATURED_PARTNERS.map((partner) => partner.id));

/** Product events the client already sends. Signup is server-only. */
const PRODUCT_EVENTS = new Set([
  "discover_open",
  "black_activated_paid",
  "black_activated_earned",
  "black_meeting_requested",
  "black_invite_sent",
  "black_connection_awarded",
]);

const BOT_UA =
  /bot\b|crawl|spider|slurp|facebookexternalhit|embedly|headless|lighthouse|pingdom|uptimerobot|wget\/|curl\/|python-requests|go-http-client|scrapy|bytespider|petalbot|whatsapp|telegrambot|slackbot|discordbot/i;

const EMAILISH = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

export function isBotUserAgent(ua: string | null | undefined): boolean {
  if (!ua || !ua.trim()) return false;
  return BOT_UA.test(ua);
}

export interface IngestedEvent {
  name: string;
  path: string;
  meta: Record<string, string>;
}

export interface AnalyticsRow {
  name: string;
  path: string;
  memberId: string | null;
  metaJson: string;
}

export function parseAnalyticsEvent(
  body: unknown
): { ok: true; event: IngestedEvent } | { ok: false; error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Invalid request" };
  }
  const rec = body as Record<string, unknown>;
  for (const key of Object.keys(rec)) {
    if (key !== "name" && key !== "path" && key !== "meta") {
      return { ok: false, error: "Invalid request" };
    }
  }
  if (typeof rec.name !== "string") return { ok: false, error: "Invalid request" };
  if (EMAILISH.test(JSON.stringify(body))) {
    return { ok: false, error: "Invalid request" };
  }

  const name = rec.name.trim();
  if (name === "partner_click") return parsePartnerClick(rec);
  if (name === "pageview") {
    const path = readPath(rec.path, true);
    if (!path.ok) return path;
    if (rec.meta !== undefined) return { ok: false, error: "Invalid request" };
    return { ok: true, event: { name, path: path.path, meta: {} } };
  }
  if (name === "signup") return { ok: false, error: "Invalid request" };
  if (!PRODUCT_EVENTS.has(name)) return { ok: false, error: "Invalid request" };

  const path = rec.path === undefined ? { ok: true as const, path: "" } : readPath(rec.path, false);
  if (!path.ok) return path;
  if (rec.meta !== undefined) return { ok: false, error: "Invalid request" };
  return { ok: true, event: { name, path: path.path, meta: {} } };
}

function parsePartnerClick(
  rec: Record<string, unknown>
): { ok: true; event: IngestedEvent } | { ok: false; error: string } {
  const path = readPath(rec.path, true);
  if (!path.ok) return path;
  const meta = rec.meta;
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) {
    return { ok: false, error: "Invalid request" };
  }
  const metaRec = meta as Record<string, unknown>;
  const keys = Object.keys(metaRec);
  if (keys.length !== 2 || metaRec.partner === undefined || metaRec.placement === undefined) {
    return { ok: false, error: "Invalid request" };
  }
  if (typeof metaRec.partner !== "string" || !PARTNER_IDS.has(metaRec.partner)) {
    return { ok: false, error: "Invalid request" };
  }
  if (
    typeof metaRec.placement !== "string" ||
    !PARTNER_PLACEMENTS.includes(metaRec.placement as PartnerPlacement)
  ) {
    return { ok: false, error: "Invalid request" };
  }
  return {
    ok: true,
    event: {
      name: "partner_click",
      path: path.path,
      meta: { partner: metaRec.partner, placement: metaRec.placement },
    },
  };
}

function readPath(
  value: unknown,
  required: boolean
): { ok: true; path: string } | { ok: false; error: string } {
  if (value === undefined || value === "") {
    if (required) return { ok: false, error: "Invalid request" };
    return { ok: true, path: "" };
  }
  if (typeof value !== "string") return { ok: false, error: "Invalid request" };
  const path = value.trim();
  if (!path.startsWith("/") || path.length > 200) return { ok: false, error: "Invalid request" };
  if (
    path.includes("://") ||
    path.includes("@") ||
    path.includes("?") ||
    path.includes("#") ||
    path.includes("\\") ||
    /\s/.test(path)
  ) {
    return { ok: false, error: "Invalid request" };
  }
  return { ok: true, path };
}

/**
 * Validate and accept one first-party event.
 * IP is used only as a rate-limit key and is never written onto the row.
 */
export async function handleAnalyticsPost(
  req: Request,
  deps: {
    memberId?: () => Promise<string | null>;
    create: (row: AnalyticsRow) => Promise<void>;
  }
): Promise<{ status: number; body: { ok: boolean; ignored?: boolean; error?: string } }> {
  const limited = rateLimit(req, {
    name: "analytics",
    limit: ANALYTICS_RATE_LIMIT,
    windowMs: ANALYTICS_RATE_WINDOW_MS,
  });
  if (!limited.ok) {
    return {
      status: 429,
      body: { ok: false, error: "Too many requests. Try again shortly." },
    };
  }

  if (isBotUserAgent(req.headers.get("user-agent"))) {
    return { status: 200, body: { ok: true, ignored: true } };
  }

  const raw = await req.text();
  if (raw.length > 2048) {
    return { status: 413, body: { ok: false, error: "Payload too large" } };
  }

  let json: unknown;
  try {
    json = raw ? JSON.parse(raw) : {};
  } catch {
    return { status: 400, body: { ok: false, error: "Invalid JSON" } };
  }

  const parsed = parseAnalyticsEvent(json);
  if (!parsed.ok) return { status: 400, body: { ok: false, error: parsed.error } };

  const memberId = deps.memberId ? await deps.memberId() : null;
  await deps.create({
    name: parsed.event.name,
    path: parsed.event.path,
    memberId: memberId || null,
    metaJson: JSON.stringify(parsed.event.meta),
  });
  return { status: 200, body: { ok: true } };
}
