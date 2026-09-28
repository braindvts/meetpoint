import { prisma } from "@/lib/db";
import {
  OPEN_REPORT_STATUSES,
  autoHiddenFromRows,
  shouldAutoHide,
} from "@/lib/safetyRules";

const openStatuses = [...OPEN_REPORT_STATUSES];

/** Member ids this viewer must not see because of a block in either direction. */
export async function blockedPeerIdSet(memberId: string): Promise<Set<string>> {
  const rows = await prisma.block.findMany({
    where: { OR: [{ blockerId: memberId }, { blockedId: memberId }] },
    select: { blockerId: true, blockedId: true },
  });
  const ids = new Set<string>();
  for (const row of rows) {
    const other = row.blockerId === memberId ? row.blockedId : row.blockerId;
    if (other && other !== memberId) ids.add(other);
  }
  return ids;
}

export async function pairIsBlocked(a: string, b: string): Promise<boolean> {
  if (!a || !b || a === b) return false;
  const row = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: a, blockedId: b },
        { blockerId: b, blockedId: a },
      ],
    },
    select: { id: true },
  });
  return !!row;
}

/** Members with open reports from OPEN_REPORT_HIDE_THRESHOLD distinct reporters. */
export async function autoHiddenMemberIds(): Promise<Set<string>> {
  const rows = await prisma.report.groupBy({
    by: ["peerId", "reporterId"],
    where: { status: { in: openStatuses } },
  });
  return autoHiddenFromRows(rows);
}

/** Ids to drop from Discover and For you for this viewer. */
export async function discoverExcludedIds(viewerId: string): Promise<string[]> {
  const [blocked, hidden] = await Promise.all([
    blockedPeerIdSet(viewerId),
    autoHiddenMemberIds(),
  ]);
  hidden.delete(viewerId);
  const ids = new Set<string>([viewerId, ...blocked, ...hidden]);
  return [...ids];
}

export type ReportStats = {
  reportCount: number;
  openReporterCount: number;
  filedCount: number;
  hiddenFromDiscover: boolean;
};

export async function reportStatsFor(
  memberIds: string[]
): Promise<Record<string, ReportStats>> {
  const stats: Record<string, ReportStats> = {};
  for (const id of memberIds) {
    stats[id] = {
      reportCount: 0,
      openReporterCount: 0,
      filedCount: 0,
      hiddenFromDiscover: false,
    };
  }
  if (!memberIds.length) return stats;

  const [against, filed, openRows] = await Promise.all([
    prisma.report.groupBy({
      by: ["peerId"],
      where: { peerId: { in: memberIds } },
      _count: { _all: true },
    }),
    prisma.report.groupBy({
      by: ["reporterId"],
      where: { reporterId: { in: memberIds } },
      _count: { _all: true },
    }),
    prisma.report.findMany({
      where: { peerId: { in: memberIds }, status: { in: openStatuses } },
      select: { peerId: true, reporterId: true },
    }),
  ]);

  for (const row of against) {
    const slot = stats[row.peerId];
    if (slot) slot.reportCount = row._count._all;
  }
  for (const row of filed) {
    const slot = stats[row.reporterId];
    if (slot) slot.filedCount = row._count._all;
  }
  const openCounts = new Map<string, Set<string>>();
  for (const row of openRows) {
    let set = openCounts.get(row.peerId);
    if (!set) {
      set = new Set();
      openCounts.set(row.peerId, set);
    }
    set.add(row.reporterId);
  }
  for (const [peerId, reporters] of openCounts) {
    const slot = stats[peerId];
    if (!slot) continue;
    slot.openReporterCount = reporters.size;
    slot.hiddenFromDiscover = shouldAutoHide(reporters.size);
  }
  return stats;
}
