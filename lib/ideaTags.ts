import { IDEA_TAGS } from "@/lib/data";
import { sanitizeText } from "@/lib/sanitize";

const catalog = new Set<string>(IDEA_TAGS);

export const CUSTOM_IDEA_TAG_MIN = 2;
export const CUSTOM_IDEA_TAG_MAX = 40;

export function isCatalogIdeaTag(tag: string): boolean {
  return catalog.has(tag);
}

/** Short label: letters, numbers, and light punctuation. No markup or URLs. */
export function isValidCustomIdeaTag(tag: string): boolean {
  const value = tag.trim().replace(/\s+/g, " ");
  if (value.length < CUSTOM_IDEA_TAG_MIN || value.length > CUSTOM_IDEA_TAG_MAX) return false;
  if (/[<>]/.test(value)) return false;
  if (/https?:\/\//i.test(value)) return false;
  if (/[\u0000-\u001f\u007f]/.test(value)) return false;
  return /^[\p{L}\p{N}][\p{L}\p{N} &'’./+-]*$/u.test(value);
}

function catalogMatch(tag: string): string | null {
  const key = tag.trim().toLowerCase();
  return IDEA_TAGS.find((item) => item.toLowerCase() === key) ?? null;
}

/** Catalog spelling when it matches, otherwise a valid custom tag. */
export function canonicalIdeaTag(tag: string): string | null {
  const listed = catalogMatch(tag);
  if (listed) return listed;
  const value = tag.trim().replace(/\s+/g, " ");
  return isValidCustomIdeaTag(value) ? value : null;
}

export function isAllowedIdeaTag(tag: string): boolean {
  return canonicalIdeaTag(tag) !== null;
}

/** Keep catalog tags and valid custom tags. Drop markup, URLs, and duplicates. */
export function normalizeIdeaTags(tags: string[], max = 12): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of tags) {
    if (/[<>]/.test(raw) || /https?:\/\//i.test(raw)) continue;
    const cleaned = sanitizeText(raw, 60).replace(/\s+/g, " ");
    const tag = canonicalIdeaTag(cleaned);
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
    if (out.length >= max) break;
  }
  return out;
}
