import { seriesFromDates, type DashboardData, type RangeKey } from "./analyticsDashboard";
import { FEATURED_PARTNERS } from "./featuredPartners";
import type { PartnerPlacement } from "./analyticsIngest";

/** Fixed clock so the sample preview does not drift. */
const NOW = new Date("2026-09-28T18:00:00.000Z");

function daysAgo(days: number, hour = 15): Date {
  const date = new Date(NOW);
  date.setUTCDate(date.getUTCDate() - days);
  date.setUTCHours(hour, 0, 0, 0);
  return date;
}

function inRange(date: Date, range: RangeKey): boolean {
  if (range === "all") return true;
  const start = new Date(NOW);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (range === "7d" ? 6 : 29));
  return date >= start;
}

interface ClickFixture {
  partner: string;
  placement: PartnerPlacement;
  at: Date;
}

function buildClicks(): ClickFixture[] {
  const rows: ClickFixture[] = [];
  const plan: { partner: string; placement: PartnerPlacement; every: number; offset: number }[] = [
    { partner: "bijuuflow", placement: "landing", every: 1, offset: 0 },
    { partner: "bijuuflow", placement: "loading", every: 2, offset: 0 },
    { partner: "grounded", placement: "landing", every: 2, offset: 1 },
    { partner: "grounded", placement: "loading", every: 3, offset: 0 },
    { partner: "onyx", placement: "landing", every: 2, offset: 0 },
    { partner: "onyx", placement: "loading", every: 4, offset: 1 },
    { partner: "edgeable", placement: "featured", every: 1, offset: 0 },
    { partner: "edgeable", placement: "landing", every: 3, offset: 2 },
    { partner: "edgeable", placement: "loading", every: 5, offset: 1 },
  ];
  for (let day = 0; day < 40; day += 1) {
    for (const item of plan) {
      if ((day + item.offset) % item.every !== 0) continue;
      rows.push({ partner: item.partner, placement: item.placement, at: daysAgo(day, 12 + (day % 6)) });
      if (item.partner === "bijuuflow" && day % 3 === 0) {
        rows.push({ partner: item.partner, placement: item.placement, at: daysAgo(day, 18) });
      }
    }
  }
  return rows;
}

const CLICKS = buildClicks();

export function sampleDashboard(range: RangeKey): DashboardData {
  const clicks = CLICKS.filter((row) => inRange(row.at, range));
  const byPartner = FEATURED_PARTNERS.map((partner) => {
    const mine = clicks.filter((row) => row.partner === partner.id);
    const byPlacement: Record<PartnerPlacement, number> = { landing: 0, loading: 0, featured: 0 };
    for (const row of mine) byPlacement[row.placement] += 1;
    return { id: partner.id, name: partner.name, total: mine.length, byPlacement };
  });

  const views = Array.from({ length: 40 }, (_, day) => daysAgo(day, 11)).filter((date) => inRange(date, range));
  const viewDates = views.flatMap((date, index) => {
    const copies = 4 + ((index * 3) % 7);
    return Array.from({ length: copies }, () => date);
  });
  const paths = ["/", "/discover", "/events", "/login", "/story", "/events/supper-club"];
  const weights = [0.42, 0.22, 0.14, 0.1, 0.07, 0.05];
  const top = paths.map((path, index) => ({
    path,
    count: Math.max(0, Math.round(viewDates.length * weights[index]!)),
  }));

  const accountDates = [0, 0, 1, 2, 3, 4, 6, 8, 9, 12, 14, 15, 18, 21, 22, 26, 29, 33, 36].map((day) =>
    daysAgo(day, 9)
  );
  const accounts = accountDates.filter((date) => inRange(date, range));
  const blackDates = [2, 9, 21, 33].map((day) => daysAgo(day, 16)).filter((date) => inRange(date, range));
  const standingBlack = Math.min(1, accounts.length);
  const standingVerified = Math.min(3, Math.max(0, accounts.length - standingBlack));
  const standingMember = Math.max(0, accounts.length - standingVerified - standingBlack);
  const paid = blackDates.length > 0 ? 1 : 0;
  const earned = blackDates.length > 2 ? 1 : 0;
  const granted = blackDates.length > 1 ? 1 : 0;

  return {
    range,
    clicks: {
      total: clicks.length,
      truncated: false,
      byPartner,
      series: seriesFromDates(
        clicks.map((row) => row.at),
        range,
        NOW
      ),
    },
    pageviews: {
      total: viewDates.length,
      truncated: false,
      series: seriesFromDates(viewDates, range, NOW),
      top,
    },
    accounts: {
      total: accounts.length,
      series: seriesFromDates(accounts, range, NOW),
      byStanding: {
        Member: standingMember,
        Verified: standingVerified,
        BLACK: standingBlack,
      },
      seededInRange: range === "7d" ? 0 : 2,
      seededAllTime: 18,
      signupEvents: Math.min(accounts.length, range === "all" ? 6 : accounts.length),
    },
    memberships: {
      blackStarted: blackDates.length,
      bySource: {
        paid,
        earned,
        granted,
        other: Math.max(0, blackDates.length - paid - earned - granted),
      },
      series: seriesFromDates(blackDates, range, NOW),
      premierLegacy: 1,
      blackMissingDate: 0,
    },
    rsvps: {
      available: true,
      total: range === "7d" ? 4 : 11,
      byStatus: [
        { status: "going", count: range === "7d" ? 2 : 6 },
        { status: "saved", count: range === "7d" ? 1 : 3 },
        { status: "passed", count: range === "7d" ? 1 : 2 },
      ],
    },
    reports: {
      available: true,
      total: range === "7d" ? 2 : 5,
      byStatus: [
        { status: "open", count: range === "7d" ? 1 : 2 },
        { status: "reviewing", count: 1 },
        { status: "resolved", count: range === "7d" ? 0 : 2 },
      ].filter((row) => row.count > 0),
    },
  };
}
