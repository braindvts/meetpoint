import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { FEATURED_PARTNERS } from "./featuredPartners";
import { PARTNER_PLACEMENTS, type PartnerPlacement } from "./analyticsIngest";
import {
  SAMPLE_LOGIN_BIO,
  SAMPLE_LOGIN_EMAIL,
  SAMPLE_LOGIN_NAME,
  SAMPLE_LOGIN_PHONE,
  SAMPLE_LOGIN_PHOTO_ID,
} from "./demoAccount";
import { DEMO_PROFILE_MARKER, LEGACY_SEED_IDS } from "./purgeDemo";

export type RangeKey = "7d" | "30d" | "all";
export type Standing = "Member" | "Verified" | "BLACK";

export interface ChartPoint {
  label: string;
  count: number;
}

export interface DashboardData {
  range: RangeKey;
  clicks: {
    total: number;
    truncated: boolean;
    byPartner: {
      id: string;
      name: string;
      total: number;
      byPlacement: Record<PartnerPlacement, number>;
    }[];
    series: ChartPoint[];
  };
  pageviews: {
    total: number;
    truncated: boolean;
    series: ChartPoint[];
    top: { path: string; count: number }[];
  };
  accounts: {
    total: number;
    series: ChartPoint[];
    byStanding: Record<Standing, number>;
    seededInRange: number;
    seededAllTime: number;
    signupEvents: number;
  };
  memberships: {
    blackStarted: number;
    bySource: { paid: number; earned: number; granted: number; other: number };
    series: ChartPoint[];
    premierLegacy: number;
    blackMissingDate: number;
  };
  rsvps: {
    available: boolean;
    total: number;
    byStatus: { status: string; count: number }[];
  };
  reports: {
    available: boolean;
    total: number;
    byStatus: { status: string; count: number }[];
  };
}

const EVENT_CAP = 20_000;
/** Charts and range windows use Eastern Time so an evening click stays on that day. */
export const CHART_TIME_ZONE = "America/New_York";

export function parseRange(value: string | undefined): RangeKey {
  if (value === "30d" || value === "all" || value === "7d") return value;
  return "7d";
}

export function rangeStart(range: RangeKey, now = new Date()): Date | null {
  if (range === "all") return null;
  const days = range === "7d" ? 7 : 30;
  const today = etParts(now);
  const start = addCalendarDays(today.year, today.month, today.day, -(days - 1));
  return etMidnight(start.year, start.month, start.day);
}

export function standingFromMember(member: {
  black: boolean;
  verificationsJson: string;
}): Standing {
  if (member.black) return "BLACK";
  let parsed: unknown = [];
  try {
    parsed = JSON.parse(member.verificationsJson || "[]");
  } catch {
    parsed = [];
  }
  if (!Array.isArray(parsed)) return "Member";
  const has = (method: string) =>
    parsed.some((row) => {
      if (!row || typeof row !== "object") return false;
      const item = row as { method?: unknown; value?: unknown };
      return item.method === method && String(item.value || "").trim().length > 0;
    });
  if (has("company-email") && has("linkedin")) return "Verified";
  return "Member";
}

export function seededMemberWhere(): Prisma.MemberWhereInput {
  return {
    OR: [
      { id: { in: [...LEGACY_SEED_IDS] } },
      { verificationsJson: { contains: DEMO_PROFILE_MARKER } },
      { email: SAMPLE_LOGIN_EMAIL },
      { verificationsJson: { contains: SAMPLE_LOGIN_EMAIL } },
      {
        // The shared guest can be stored without the demo email or LinkedIn marker.
        // Name plus phone, photo, or bio keeps a real Mohammed who is none of those.
        AND: [
          { name: { equals: SAMPLE_LOGIN_NAME, mode: "insensitive" } },
          {
            OR: [
              { phone: SAMPLE_LOGIN_PHONE },
              { photo: { contains: SAMPLE_LOGIN_PHOTO_ID } },
              { bio: SAMPLE_LOGIN_BIO },
            ],
          },
        ],
      },
    ],
  };
}

export function realMemberWhere(): Prisma.MemberWhereInput {
  return { NOT: seededMemberWhere() };
}

function partMap(date: Date): Record<string, number> {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: CHART_TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const map: Record<string, number> = {};
  for (const part of fmt.formatToParts(date)) {
    if (part.type === "literal") continue;
    map[part.type] = Number(part.value);
  }
  if (map.hour === 24) map.hour = 0;
  return map;
}

function etParts(date: Date): { year: number; month: number; day: number } {
  const map = partMap(date);
  return { year: map.year!, month: map.month!, day: map.day! };
}

function ymd(parts: { year: number; month: number; day: number }): string {
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function addCalendarDays(year: number, month: number, day: number, delta: number) {
  const utc = new Date(Date.UTC(year, month - 1, day + delta));
  return { year: utc.getUTCFullYear(), month: utc.getUTCMonth() + 1, day: utc.getUTCDate() };
}

/** UTC instant of midnight in America/New_York on this calendar day. */
function etMidnight(year: number, month: number, day: number): Date {
  const noon = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const wall = partMap(noon);
  const midnightAsUtc = Date.UTC(wall.year!, wall.month! - 1, wall.day!, 0, 0, 0);
  const noonWallAsUtc = Date.UTC(
    wall.year!,
    wall.month! - 1,
    wall.day!,
    wall.hour!,
    wall.minute!,
    wall.second!
  );
  const offsetMs = noonWallAsUtc - noon.getTime();
  return new Date(midnightAsUtc - offsetMs);
}

function startOfEtDay(date: Date): Date {
  const parts = etParts(date);
  return etMidnight(parts.year, parts.month, parts.day);
}

function dayKey(date: Date): string {
  return ymd(etParts(date));
}

function calendarSpan(start: Date, end: Date): number {
  const a = etParts(start);
  const b = etParts(end);
  const from = Date.UTC(a.year, a.month - 1, a.day);
  const to = Date.UTC(b.year, b.month - 1, b.day);
  return Math.round((to - from) / 86_400_000) + 1;
}

function dayLabel(key: string): string {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, (month || 1) - 1, day || 1));
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export function seriesFromDates(dates: Date[], range: RangeKey, now = new Date()): ChartPoint[] {
  const end = startOfEtDay(now);
  const start =
    range === "all"
      ? dates.length
        ? startOfEtDay(dates.reduce((min, date) => (date < min ? date : min), dates[0]!))
        : end
      : rangeStart(range, now)!;

  if (range === "all" && calendarSpan(start, end) > 62) return bucketWeeks(dates, start, end);
  return bucketDays(dates, start, end);
}

function bucketDays(dates: Date[], start: Date, end: Date): ChartPoint[] {
  const counts = new Map<string, number>();
  for (const date of dates) {
    const key = dayKey(date);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const points: ChartPoint[] = [];
  let cursor = etParts(start);
  const lastKey = dayKey(end);
  while (points.length < 400) {
    const key = ymd(cursor);
    points.push({ label: dayLabel(key), count: counts.get(key) || 0 });
    if (key >= lastKey) break;
    cursor = addCalendarDays(cursor.year, cursor.month, cursor.day, 1);
  }
  return points;
}

function weekKey(date: Date): string {
  const parts = etParts(date);
  const weekday = new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
  return ymd(addCalendarDays(parts.year, parts.month, parts.day, -weekday));
}

function bucketWeeks(dates: Date[], start: Date, end: Date): ChartPoint[] {
  const counts = new Map<string, number>();
  for (const date of dates) {
    const key = weekKey(date);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const points: ChartPoint[] = [];
  let cursor = weekKey(start);
  const last = weekKey(end);
  while (points.length < 120) {
    points.push({ label: `Week of ${dayLabel(cursor)}`, count: counts.get(cursor) || 0 });
    if (cursor >= last) break;
    const [year, month, day] = cursor.split("-").map(Number);
    cursor = ymd(addCalendarDays(year!, month!, day!, 7));
  }
  return points;
}

function emptyPlacements(): Record<PartnerPlacement, number> {
  return { landing: 0, loading: 0, featured: 0 };
}

function since(start: Date | null): { gte: Date } | undefined {
  return start ? { gte: start } : undefined;
}

export async function loadAnalyticsDashboard(
  range: RangeKey,
  now = new Date()
): Promise<DashboardData> {
  const start = rangeStart(range, now);
  const created = since(start);

  const [
    members,
    seededInRange,
    seededAllTime,
    blackRows,
    blackMissingDate,
    premierLegacy,
    clickRows,
    viewRows,
    signupEvents,
    reports,
    rsvps,
  ] = await Promise.all([
    prisma.member.findMany({
      where: { AND: [realMemberWhere(), created ? { createdAt: created } : {}] },
      select: { createdAt: true, black: true, verificationsJson: true },
    }),
    prisma.member.count({
      where: { AND: [seededMemberWhere(), created ? { createdAt: created } : {}] },
    }),
    prisma.member.count({ where: seededMemberWhere() }),
    prisma.member.findMany({
      where: {
        AND: [
          realMemberWhere(),
          { black: true },
          start ? { blackSince: { gte: start } } : { blackSince: { not: null } },
        ],
      },
      select: { blackSince: true, blackSource: true },
    }),
    prisma.member.count({
      where: { AND: [realMemberWhere(), { black: true, blackSince: null }] },
    }),
    prisma.member.count({
      where: { AND: [realMemberWhere(), { premierActive: true }] },
    }),
    prisma.analyticsEvent.findMany({
      where: { name: "partner_click", ...(created ? { createdAt: created } : {}) },
      select: { createdAt: true, metaJson: true },
      orderBy: { createdAt: "desc" },
      take: EVENT_CAP,
    }),
    prisma.analyticsEvent.findMany({
      where: { name: "pageview", ...(created ? { createdAt: created } : {}) },
      select: { createdAt: true, path: true },
      orderBy: { createdAt: "desc" },
      take: EVENT_CAP,
    }),
    prisma.analyticsEvent.count({
      where: { name: "signup", ...(created ? { createdAt: created } : {}) },
    }),
    loadReports(start),
    loadRsvps(start),
  ]);

  const byStanding: Record<Standing, number> = { Member: 0, Verified: 0, BLACK: 0 };
  for (const member of members) byStanding[standingFromMember(member)] += 1;

  const partners = new Map<
    string,
    { id: string; name: string; total: number; byPlacement: Record<PartnerPlacement, number> }
  >();
  for (const partner of FEATURED_PARTNERS) {
    partners.set(partner.id, {
      id: partner.id,
      name: partner.name,
      total: 0,
      byPlacement: emptyPlacements(),
    });
  }

  for (const row of clickRows) {
    let partner = "";
    let placement: PartnerPlacement | "" = "";
    try {
      const meta = JSON.parse(row.metaJson) as { partner?: string; placement?: string };
      if (meta.partner && partners.has(meta.partner)) partner = meta.partner;
      if (PARTNER_PLACEMENTS.includes(meta.placement as PartnerPlacement)) {
        placement = meta.placement as PartnerPlacement;
      }
    } catch {
      partner = "";
    }
    if (!partner || !placement) continue;
    const bucket = partners.get(partner)!;
    bucket.total += 1;
    bucket.byPlacement[placement] += 1;
  }

  const clickDates = clickRows.flatMap((row) => {
    try {
      const meta = JSON.parse(row.metaJson) as { partner?: string; placement?: string };
      if (!meta.partner || !partners.has(meta.partner)) return [];
      if (!PARTNER_PLACEMENTS.includes(meta.placement as PartnerPlacement)) return [];
      return [row.createdAt];
    } catch {
      return [];
    }
  });

  const top = new Map<string, number>();
  for (const row of viewRows) {
    const path = row.path || "/";
    top.set(path, (top.get(path) || 0) + 1);
  }

  const bySource = { paid: 0, earned: 0, granted: 0, other: 0 };
  for (const row of blackRows) {
    if (row.blackSource === "paid" || row.blackSource === "earned" || row.blackSource === "granted") {
      bySource[row.blackSource] += 1;
    } else bySource.other += 1;
  }

  return {
    range,
    clicks: {
      total: clickDates.length,
      truncated: clickRows.length >= EVENT_CAP,
      byPartner: FEATURED_PARTNERS.map((partner) => partners.get(partner.id)!),
      series: seriesFromDates(clickDates, range, now),
    },
    pageviews: {
      total: viewRows.length,
      truncated: viewRows.length >= EVENT_CAP,
      series: seriesFromDates(
        viewRows.map((row) => row.createdAt),
        range,
        now
      ),
      top: [...top.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 8)
        .map(([path, count]) => ({ path, count })),
    },
    accounts: {
      total: members.length,
      series: seriesFromDates(
        members.map((member) => member.createdAt),
        range,
        now
      ),
      byStanding,
      seededInRange,
      seededAllTime,
      signupEvents,
    },
    memberships: {
      blackStarted: blackRows.length,
      bySource,
      series: seriesFromDates(
        blackRows.flatMap((row) => (row.blackSince ? [row.blackSince] : [])),
        range,
        now
      ),
      premierLegacy,
      blackMissingDate,
    },
    rsvps,
    reports,
  };
}

async function loadReports(start: Date | null): Promise<DashboardData["reports"]> {
  try {
    const rows = await prisma.report.groupBy({
      by: ["status"],
      where: start ? { createdAt: { gte: start } } : {},
      _count: { _all: true },
    });
    const byStatus = rows
      .map((row) => ({ status: row.status || "open", count: row._count._all }))
      .sort((a, b) => b.count - a.count);
    return {
      available: true,
      total: byStatus.reduce((sum, row) => sum + row.count, 0),
      byStatus,
    };
  } catch {
    return { available: false, total: 0, byStatus: [] };
  }
}

async function loadRsvps(start: Date | null): Promise<DashboardData["rsvps"]> {
  try {
    const rows = start
      ? await prisma.$queryRaw<Array<{ status: string; n: number }>>`
          SELECT "status", COUNT(*)::int AS n
          FROM "EventInterest"
          WHERE "createdAt" >= ${start}
          GROUP BY "status"
        `
      : await prisma.$queryRaw<Array<{ status: string; n: number }>>`
          SELECT "status", COUNT(*)::int AS n
          FROM "EventInterest"
          GROUP BY "status"
        `;
    const byStatus = rows
      .map((row) => ({ status: String(row.status || "unknown"), count: Number(row.n) || 0 }))
      .sort((a, b) => b.count - a.count);
    return {
      available: true,
      total: byStatus.reduce((sum, row) => sum + row.count, 0),
      byStatus,
    };
  } catch {
    return { available: false, total: 0, byStatus: [] };
  }
}
