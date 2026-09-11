/** Unique lines for splash and landing — one is chosen per visit. */
export const INTERLINK_LINES = [
  "Private introductions. Settled over dinner.",
  "A room for people who still keep their word.",
  "Ambition finds its table.",
  "Not a feed. A reservation.",
  "The conversation starts after the first course.",
  "Matched by craft. Seated with intent.",
  "Where a handshake still means something.",
  "Introductions that end at a real table.",
];

/** @deprecated use INTERLINK_LINES */
export const CONCLAVE_LINES = INTERLINK_LINES;

export function pickInterlinkLine(seed?: number): string {
  const i =
    typeof seed === "number"
      ? Math.abs(Math.floor(seed)) % INTERLINK_LINES.length
      : Math.floor(Math.random() * INTERLINK_LINES.length);
  return INTERLINK_LINES[i];
}

/** @deprecated use pickInterlinkLine */
export function pickConclaveLine(seed?: number): string {
  return pickInterlinkLine(seed);
}
