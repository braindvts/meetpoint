import { prisma } from "./db";
import { classifySample, sampleMemberWhere, type SampleKind } from "./sampleAccounts";

let done: Promise<void> | null = null;

/**
 * Flag sample, guest, and bot rows so Discover and member counts skip them.
 * Does not delete anything. Removal is scripts/cleanup-sample-accounts.ts,
 * dry-run unless an operator passes --apply after a backup.
 */
export async function markSampleAccounts(): Promise<number> {
  const rows = await prisma.member.findMany({
    where: sampleMemberWhere(),
    select: {
      id: true,
      email: true,
      photo: true,
      verificationsJson: true,
      linkedInId: true,
      isSample: true,
      sampleKind: true,
    },
  });

  let marked = 0;
  for (const row of rows) {
    const kind: SampleKind | null = classifySample(row);
    if (!kind) continue;
    if (row.isSample && row.sampleKind === kind) continue;
    await prisma.member.update({
      where: { id: row.id },
      data: { isSample: true, sampleKind: kind },
    });
    marked += 1;
  }
  return marked;
}

export function purgeDemoResidue(): Promise<void> {
  if (!done) {
    done = markSampleAccounts()
      .then(() => undefined)
      .catch((err) => {
        done = null;
        throw err;
      });
  }
  return done;
}
