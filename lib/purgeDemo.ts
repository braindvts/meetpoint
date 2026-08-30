import { prisma } from "./db";

let done: Promise<void> | null = null;

/** Ids of the fake members this app used to ship with. */
const LEGACY_SEED_IDS = Array.from({ length: 18 }, (_, i) => `p${i + 1}`);

/** The old "Enter demo" account signed itself with this LinkedIn value. */
const DEMO_PROFILE_MARKER = "linkedin.com/in/conclave-demo";

async function removeMembers(ids: string[]): Promise<void> {
  if (!ids.length) return;
  await prisma.message.deleteMany({ where: { senderId: { in: ids } } });
  await prisma.chatMember.deleteMany({ where: { memberId: { in: ids } } });
  await prisma.connection.deleteMany({
    where: { OR: [{ fromId: { in: ids } }, { toId: { in: ids } }] },
  });
  await prisma.block
    .deleteMany({
      where: { OR: [{ blockerId: { in: ids } }, { blockedId: { in: ids } }] },
    })
    .catch(() => undefined);
  await prisma.member.deleteMany({ where: { id: { in: ids } } });
}

/**
 * Conclave only shows real members. Older builds seeded fake profiles and shipped
 * an "Enter demo" account that synced itself to the server, so clear both (and
 * their graph edges) once per server process.
 */
export function purgeDemoResidue(): Promise<void> {
  if (!done) {
    done = (async () => {
      const seeds = await prisma.member.findMany({
        where: { id: { in: LEGACY_SEED_IDS } },
        select: { id: true },
      });
      await removeMembers(seeds.map((s) => s.id));

      const demoAccounts = await prisma.member.findMany({
        where: { verificationsJson: { contains: DEMO_PROFILE_MARKER } },
        select: { id: true },
      });
      await removeMembers(demoAccounts.map((m) => m.id));
    })().catch((err) => {
      done = null;
      throw err;
    });
  }
  return done;
}
