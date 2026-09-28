/**
 * Copy catalog interest labels into MemberInterest rows.
 *
 * One-off. Not part of CI, `npm run build`, or a page request.
 * Walks members by id so an empty profile does not pin the cursor.
 *
 *   npx tsx scripts/backfill-member-interests.ts
 */
import { backfillInterestBatch } from "../lib/interestBackfill";
import { prisma } from "../lib/db";

async function main() {
  let cursor: string | null = null;
  let written = 0;
  let scanned = 0;

  for (;;) {
    const step = await backfillInterestBatch(cursor);
    written += step.written;
    scanned += step.scanned;
    cursor = step.nextCursor;
    if (step.done) break;
    console.log(`Scanned ${scanned}. Cursor ${cursor}.`);
  }

  console.log(`Done. Scanned ${scanned} real members. Wrote interests for ${written}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
