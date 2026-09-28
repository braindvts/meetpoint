/**
 * Remove sample, guest, and bot member accounts.
 *
 * Dry-run by default. Nothing is deleted unless you pass --apply.
 * This script is not part of CI, `npm run build`, or Vercel deploy.
 * If those environments invoke it, it exits without reading or writing the database.
 *
 * WARNING: Do not run --apply until it is confirmed that preview and production use different databases and a backup exists.
 * Then:
 * 1. The owner confirms that backup.
 * 2. A teammate reviews the dry-run output against a preview database.
 *
 *   npx tsx scripts/cleanup-sample-accounts.ts
 *   npx tsx scripts/cleanup-sample-accounts.ts --apply
 *
 * A row is a sample when any of these is true (see lib/sampleAccounts.ts):
 * - Member.isSample is true, or sampleKind is set
 * - id is a legacy seed id p1–p18
 * - verifications or linkedInId contain "conclave-demo"
 * - email is exactly demo@conclave.app
 * - photo is exactly https://randomuser.me/api/portraits/(men|women)/<n>.jpg
 *   (n is 0–99). A photo that only mentions randomuser.me is not a sample.
 *
 * Nothing is reassigned. Real members, their RSVPs, and the event catalog stay.
 * A chat that still has a real member stays; the sample is only detached.
 * Reports a real member filed about a sample stay.
 * The script is idempotent: a second --apply finds nothing left to remove.
 */
import { PrismaClient } from "@prisma/client";
import { classifySample, sampleMarkers, sampleMemberWhere } from "../lib/sampleAccounts";
import {
  CLEANUP_APPLY_WARNING,
  cleanupBlockedByEnvironment,
  formatCleanupPlan,
  type CleanupPlan,
} from "../lib/sampleCleanup";

const apply = process.argv.includes("--apply");
const blocked = cleanupBlockedByEnvironment();
if (blocked) {
  console.error(
    `Refusing to run sample cleanup during ${blocked}. It is not part of build or deploy, and it does not run in CI.`
  );
  process.exit(0);
}

console.error(`WARNING: ${CLEANUP_APPLY_WARNING}`);

const prisma = new PrismaClient();

async function planFor(ids: string[]): Promise<CleanupPlan["remove"] & CleanupPlan["keep"] & { eventIds: string[] }> {
  if (ids.length === 0) {
    const realMemberRsvps = await prisma.eventInterest.count();
    return {
      members: 0,
      eventRsvps: 0,
      eventIds: [],
      connections: 0,
      emptyChats: 0,
      sampleMessages: 0,
      blocks: 0,
      blackInvites: 0,
      blackConnections: 0,
      interests: 0,
      analytics: 0,
      reportsFiledBySamples: 0,
      realMemberRsvps,
      chatsSharedWithRealMembers: 0,
      reportsAboutSamples: 0,
    };
  }

  const [
    eventRows,
    realMemberRsvps,
    connections,
    sampleMessages,
    blocks,
    blackInvites,
    blackConnections,
    interests,
    analytics,
    reportsFiledBySamples,
    reportsAboutSamples,
    memberships,
  ] = await Promise.all([
    prisma.eventInterest.findMany({
      where: { memberId: { in: ids } },
      select: { eventId: true },
    }),
    prisma.eventInterest.count({ where: { memberId: { notIn: ids } } }),
    prisma.connection.count({
      where: { OR: [{ fromId: { in: ids } }, { toId: { in: ids } }] },
    }),
    prisma.message.count({ where: { senderId: { in: ids } } }),
    prisma.block.count({
      where: { OR: [{ blockerId: { in: ids } }, { blockedId: { in: ids } }] },
    }),
    prisma.blackInvite.count({
      where: { OR: [{ fromId: { in: ids } }, { toId: { in: ids } }] },
    }),
    prisma.blackConnection.count({
      where: { OR: [{ blackMemberId: { in: ids } }, { peerId: { in: ids } }] },
    }),
    prisma.memberInterest.count({ where: { memberId: { in: ids } } }),
    prisma.analyticsEvent.count({ where: { memberId: { in: ids } } }),
    prisma.report.count({ where: { reporterId: { in: ids } } }),
    prisma.report.count({
      where: { peerId: { in: ids }, reporterId: { notIn: ids } },
    }),
    prisma.chatMember.findMany({
      where: { memberId: { in: ids } },
      select: { chatId: true },
    }),
  ]);

  const chatIds = [...new Set(memberships.map((row) => row.chatId))];
  let chatsSharedWithRealMembers = 0;
  if (chatIds.length) {
    const shared = await prisma.chatMember.findMany({
      where: { chatId: { in: chatIds }, memberId: { notIn: ids } },
      select: { chatId: true },
      distinct: ["chatId"],
    });
    chatsSharedWithRealMembers = shared.length;
  }

  const eventIds = [...new Set(eventRows.map((row) => row.eventId))].sort();
  return {
    members: ids.length,
    eventRsvps: eventRows.length,
    eventIds,
    connections,
    emptyChats: chatIds.length - chatsSharedWithRealMembers,
    sampleMessages,
    blocks,
    blackInvites,
    blackConnections,
    interests,
    analytics,
    reportsFiledBySamples,
    realMemberRsvps,
    chatsSharedWithRealMembers,
    reportsAboutSamples,
  };
}

async function main() {
  const rows = await prisma.member.findMany({
    where: sampleMemberWhere(),
    select: {
      id: true,
      name: true,
      email: true,
      photo: true,
      verificationsJson: true,
      linkedInId: true,
      isSample: true,
      sampleKind: true,
    },
  });

  const samples = rows.filter((row) => classifySample(row));
  const ids = samples.map((row) => row.id);
  const counts = await planFor(ids);
  const plan: CleanupPlan = {
    accounts: samples.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      kind: classifySample(row) || "sample",
      markers: sampleMarkers(row),
    })),
    remove: {
      members: counts.members,
      eventRsvps: counts.eventRsvps,
      eventIds: counts.eventIds,
      connections: counts.connections,
      emptyChats: counts.emptyChats,
      sampleMessages: counts.sampleMessages,
      blocks: counts.blocks,
      blackInvites: counts.blackInvites,
      blackConnections: counts.blackConnections,
      interests: counts.interests,
      analytics: counts.analytics,
      reportsFiledBySamples: counts.reportsFiledBySamples,
    },
    keep: {
      realMemberRsvps: counts.realMemberRsvps,
      chatsSharedWithRealMembers: counts.chatsSharedWithRealMembers,
      reportsAboutSamples: counts.reportsAboutSamples,
    },
  };

  console.log(formatCleanupPlan(plan, apply));
  if (!apply || ids.length === 0) return;

  await prisma.$transaction(async (tx) => {
    await tx.message.deleteMany({ where: { senderId: { in: ids } } });

    const memberships = await tx.chatMember.findMany({
      where: { memberId: { in: ids } },
      select: { chatId: true },
    });
    const chatIds = [...new Set(memberships.map((row) => row.chatId))];
    await tx.chatMember.deleteMany({ where: { memberId: { in: ids } } });
    if (chatIds.length) {
      const still = await tx.chatMember.findMany({
        where: { chatId: { in: chatIds } },
        select: { chatId: true },
      });
      const occupied = new Set(still.map((row) => row.chatId));
      const empty = chatIds.filter((id) => !occupied.has(id));
      if (empty.length) {
        await tx.message.deleteMany({ where: { chatId: { in: empty } } });
        await tx.chat.deleteMany({ where: { id: { in: empty } } });
      }
    }

    await tx.connection.deleteMany({
      where: { OR: [{ fromId: { in: ids } }, { toId: { in: ids } }] },
    });
    await tx.block.deleteMany({
      where: { OR: [{ blockerId: { in: ids } }, { blockedId: { in: ids } }] },
    });
    await tx.blackInvite.deleteMany({
      where: { OR: [{ fromId: { in: ids } }, { toId: { in: ids } }] },
    });
    await tx.blackConnection.deleteMany({
      where: { OR: [{ blackMemberId: { in: ids } }, { peerId: { in: ids } }] },
    });
    await tx.memberInterest.deleteMany({ where: { memberId: { in: ids } } });
    await tx.analyticsEvent.deleteMany({ where: { memberId: { in: ids } } });
    await tx.report.deleteMany({ where: { reporterId: { in: ids } } });
    await tx.eventInterest.deleteMany({ where: { memberId: { in: ids } } });

    const removed = await tx.member.deleteMany({ where: { id: { in: ids } } });
    console.log(`Removed ${removed.count} sample account(s). Real members and their RSVPs were left in place.`);
  }, { timeout: 120_000, maxWait: 20_000 });
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
