import { timingSafeEqual } from "crypto";

/** Constant-time string compare. Length mismatches fail closed. */
export function secretsMatch(got: string, expected: string): boolean {
  try {
    const a = Buffer.from(got);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
