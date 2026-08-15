import { PEOPLE } from "./data";
import { prisma } from "./db";
import { demoProfilesEnabled } from "./demoFlag";

let ready: Promise<void> | null = null;

const SEED_IDS = PEOPLE.map((p) => p.id);

/**
 * Keeps the member directory honest:
 * - Demo profiles ON → upsert seed PEOPLE
 * - Demo profiles OFF (default) → remove seed PEOPLE so The Room is real members only
 */
export function ensureSeeded(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      if (demoProfilesEnabled()) {
        for (const p of PEOPLE) {
          await prisma.member.upsert({
            where: { id: p.id },
            create: {
              id: p.id,
              name: p.name,
              jobTitle: p.jobTitle,
              bio: p.bio,
              photo: p.photoUrl || "",
              cityName: p.city.name,
              cityCountry: p.city.country,
              cityLat: p.city.lat,
              cityLng: p.city.lng,
              travel: p.travel,
              lookingForJson: JSON.stringify(p.lookingFor || []),
              ideaTagsJson: JSON.stringify(p.ideaTags || []),
              verificationsJson: JSON.stringify([
                {
                  method: "linkedin",
                  value: p.linkedInUrl || `seed:${p.id}`,
                  verifiedAt: new Date().toISOString(),
                },
              ]),
            },
            update: {
              name: p.name,
              jobTitle: p.jobTitle,
              bio: p.bio,
              photo: p.photoUrl || "",
            },
          });
        }
        return;
      }

      // Remove previously seeded demo people (and their graph edges)
      const seeds = await prisma.member.findMany({
        where: { id: { in: SEED_IDS } },
        select: { id: true },
      });
      if (!seeds.length) return;
      const ids = seeds.map((s) => s.id);
      await prisma.message.deleteMany({ where: { senderId: { in: ids } } });
      await prisma.chatMember.deleteMany({ where: { memberId: { in: ids } } });
      await prisma.connection.deleteMany({
        where: { OR: [{ fromId: { in: ids } }, { toId: { in: ids } }] },
      });
      await prisma.block.deleteMany({
        where: { OR: [{ blockerId: { in: ids } }, { blockedId: { in: ids } }] },
      }).catch(() => undefined);
      await prisma.member.deleteMany({ where: { id: { in: ids } } });
    })().catch((err) => {
      ready = null;
      throw err;
    });
  }
  return ready;
}

export function seedMemberIds(): string[] {
  return [...SEED_IDS];
}
