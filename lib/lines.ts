/** Unique lines for splash and landing — one is chosen per visit. */
export const CONCLAVE_LINES = [
  "Private introductions. Settled over dinner.",
  "A room for people who still keep their word.",
  "Ambition finds its table.",
  "Not a feed. A reservation.",
  "The conversation starts after the first course.",
  "Matched by craft. Seated with intent.",
  "Where a handshake still means something.",
  "Introductions that end at a real table.",
];

export function pickConclaveLine(seed?: number): string {
  const i =
    typeof seed === "number"
      ? Math.abs(Math.floor(seed)) % CONCLAVE_LINES.length
      : Math.floor(Math.random() * CONCLAVE_LINES.length);
  return CONCLAVE_LINES[i];
}
