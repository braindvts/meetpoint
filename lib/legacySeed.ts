import { prisma } from "./db";

let done: Promise<void> | null = null;

/** Ids of the fake members this app used to ship with. */
const LEGACY_SEED_IDS = Array.from({ length: 18 }, (_, i) => `p${i + 1}`);

/**
 * Conclave only shows real members. Older builds seeded fake profiles into the
 * database, so clear them (and their graph edges) once per server process.
 */
export function purgeLegacySeedMembers(): Promise<void> {
  if (!done) {
    done = (async () => {
      const seeds = await prisma.member.findMany({
        where: { id: { in: LEGACY_SEED_IDS } },
        select: { id: true },
      });
      if (!seeds.length) return;

      const ids = seeds.map((s) => s.id);
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
    })().catch((err) => {
      done = null;
      throw err;
    });
  }
  return done;
}
