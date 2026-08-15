import type { MeetingRating, ReputationStatus, ReputationSummary } from "./types";

/** Seed standing so the room already feels curated before any ratings. */
const SEED_RATINGS: Record<string, MeetingRating[]> = {
  p1: seed(4, [true, true, true, true]),
  p2: seed(5, [true, true, true, true]),
  p3: seed(3, [true, true, true, false]),
  p4: seed(4, [true, true, true, true]),
  p5: seed(2, [true, false, true, false]),
  p6: seed(6, [true, true, true, true]),
  p7: seed(3, [true, true, false, true]),
  p8: seed(5, [true, true, true, true]),
  p9: seed(4, [true, true, true, true]),
  p10: seed(3, [true, true, true, true]),
  p11: seed(5, [true, true, true, true]),
  p12: seed(2, [true, true, false, true]),
  p13: seed(4, [true, true, true, true]),
  p14: seed(3, [true, true, true, true]),
  p15: seed(2, [false, true, false, false]),
  p16: seed(4, [true, true, true, true]),
  p17: seed(3, [true, true, true, false]),
  p18: seed(5, [true, true, true, true]),
};

function seed(
  count: number,
  pattern: [boolean, boolean, boolean, boolean]
): MeetingRating[] {
  return Array.from({ length: count }, (_, i) => ({
    peerId: "seed",
    showedUp: pattern[0],
    professional: pattern[1],
    valuable: i === 0 ? pattern[2] : true,
    wouldMeetAgain: pattern[3],
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  }));
}

export const VISIBILITY_CAUTION_SCORE = 60;
export const VISIBILITY_HIDE_SCORE = 40;
export const MIN_RATINGS_FOR_PENALTY = 2;

export function summarizeReputation(
  peerId: string,
  userRatings: MeetingRating[]
): ReputationSummary {
  const all = [...(SEED_RATINGS[peerId] || []), ...userRatings.filter((r) => r.peerId === peerId)];
  const ratingCount = all.length;

  if (ratingCount === 0) {
    return {
      peerId,
      ratingCount: 0,
      showedUpRate: 1,
      professionalRate: 1,
      valuableRate: 1,
      wouldMeetAgainRate: 1,
      score: 100,
      status: "standing",
    };
  }

  const avg = (key: keyof Pick<MeetingRating, "showedUp" | "professional" | "valuable" | "wouldMeetAgain">) =>
    all.filter((r) => r[key]).length / ratingCount;

  const showedUpRate = avg("showedUp");
  const professionalRate = avg("professional");
  const valuableRate = avg("valuable");
  const wouldMeetAgainRate = avg("wouldMeetAgain");

  const score = Math.round(
    (showedUpRate * 0.3 +
      professionalRate * 0.25 +
      valuableRate * 0.25 +
      wouldMeetAgainRate * 0.2) *
      100
  );

  let status: ReputationStatus = "standing";
  if (ratingCount >= MIN_RATINGS_FOR_PENALTY) {
    if (score < VISIBILITY_HIDE_SCORE) status = "hidden";
    else if (score < VISIBILITY_CAUTION_SCORE) status = "caution";
  }

  return {
    peerId,
    ratingCount,
    showedUpRate,
    professionalRate,
    valuableRate,
    wouldMeetAgainRate,
    score,
    status,
  };
}
