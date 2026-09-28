import { prisma } from "./db";
import { canonicalInterests } from "./interests";

/** Rows read per pass. The cursor moves past every row, including empty profiles. */
export const INTEREST_BACKFILL_BATCH = 200;

export interface InterestBackfillStep {
  written: number;
  scanned: number;
  nextCursor: string | null;
  done: boolean;
}

/**
 * One page of real members, ordered by id, after `afterId`.
 * Members with no catalog tags are still advanced past so the next run
 * does not reread the same page.
 */
export async function backfillInterestBatch(afterId: string | null): Promise<InterestBackfillStep> {
  const rows = await prisma.member.findMany({
    where: {
      isSample: false,
      ...(afterId ? { id: { gt: afterId } } : {}),
    },
    select: { id: true, ideaTagsJson: true },
    orderBy: { id: "asc" },
    take: INTEREST_BACKFILL_BATCH,
  });

  let written = 0;
  for (const row of rows) {
    let labels: string[] = [];
    try {
      const parsed = JSON.parse(row.ideaTagsJson) as unknown;
      if (Array.isArray(parsed)) labels = parsed.filter((item) => typeof item === "string");
    } catch {
      labels = [];
    }
    const interests = canonicalInterests(labels);
    if (!interests.length) continue;
    await prisma.memberInterest.createMany({
      data: interests.map((item) => ({ memberId: row.id, slug: item.slug })),
      skipDuplicates: true,
    });
    written += 1;
  }

  const nextCursor = rows.length ? rows[rows.length - 1].id : afterId;
  return {
    written,
    scanned: rows.length,
    nextCursor,
    done: rows.length < INTEREST_BACKFILL_BATCH,
  };
}
