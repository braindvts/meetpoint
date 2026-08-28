/**
 * Seed demo PEOPLE into SQLite so Discover can serve DB-backed members.
 * Run: npx tsx scripts/seed-members.ts
 */
import { PrismaClient } from "@prisma/client";
import { PEOPLE } from "../lib/data";

const prisma = new PrismaClient();

async function main() {
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
        elite: p.id.includes("elite") || false,
      },
      update: {
        name: p.name,
        jobTitle: p.jobTitle,
        bio: p.bio,
        photo: p.photoUrl || "",
        cityName: p.city.name,
        cityCountry: p.city.country,
        cityLat: p.city.lat,
        cityLng: p.city.lng,
        lookingForJson: JSON.stringify(p.lookingFor || []),
        ideaTagsJson: JSON.stringify(p.ideaTags || []),
      },
    });
  }
  console.log(`Seeded ${PEOPLE.length} members.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
