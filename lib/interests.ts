import { IDEA_TAGS } from "./data";
import { canonicalIdeaTag, isCatalogIdeaTag } from "./ideaTags";
import { LOOKING_FOR_OPTIONS, type LookingFor } from "./types";

/** Catalog interests plus custom tags, together, on one profile. */
export const IDEA_TAG_LIMIT = 24;

/**
 * Canonical interest categories.
 * Stored as MemberInterest.slug rows. Labels are what members see and what
 * event matching reads (ideaTags). Free-text tags are not interests.
 */
export interface InterestCategory {
  slug: string;
  label: string;
}

export function interestSlug(label: string): string {
  return label
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export const INTERESTS: InterestCategory[] = IDEA_TAGS.map((label) => ({
  slug: interestSlug(label),
  label,
}));

const BY_SLUG = new Map(INTERESTS.map((item) => [item.slug, item]));
const BY_LABEL = new Map(INTERESTS.map((item) => [item.label.toLowerCase(), item]));

export function interestBySlug(slug: string): InterestCategory | null {
  return BY_SLUG.get(slug) || null;
}

export function interestByLabel(label: string): InterestCategory | null {
  return BY_LABEL.get(label.trim().toLowerCase()) || null;
}

/** Keep only catalog interests, in first-seen order, capped. */
export function canonicalInterests(raw: readonly string[], max = 24): InterestCategory[] {
  const out: InterestCategory[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const hit = interestByLabel(item) || interestBySlug(interestSlug(item));
    if (!hit || seen.has(hit.slug)) continue;
    seen.add(hit.slug);
    out.push(hit);
    if (out.length >= max) break;
  }
  return out;
}

/**
 * Keep catalog interests and valid custom tags, in first-seen order.
 * Custom tags must pass the plain-text rules (short, no URLs, no markup).
 * Only catalog entries are returned in `canonical` for matching.
 */
export function partitionIdeaTags(
  raw: readonly string[],
  max = IDEA_TAG_LIMIT
): { labels: string[]; canonical: InterestCategory[] } {
  const labels: string[] = [];
  const canonical: InterestCategory[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const tag = canonicalIdeaTag(String(item));
    if (!tag) continue;
    const hit = interestByLabel(tag);
    if (hit) {
      if (seen.has(`c:${hit.slug}`)) continue;
      seen.add(`c:${hit.slug}`);
      seen.add(`t:${hit.label.toLowerCase()}`);
      labels.push(hit.label);
      canonical.push(hit);
    } else if (!isCatalogIdeaTag(tag)) {
      const key = `t:${tag.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      labels.push(tag);
    }
    if (labels.length >= max) break;
  }
  return { labels, canonical };
}

export function labelsForSlugs(slugs: readonly string[]): string[] {
  const out: string[] = [];
  for (const slug of slugs) {
    const hit = interestBySlug(slug);
    if (hit) out.push(hit.label);
  }
  return out;
}

/**
 * Industries a member can claim. Labels line up with the event catalog
 * where the names match (AI, Finance, Real Estate, …).
 */
export const INDUSTRIES = [
  "AI",
  "Business",
  "Education",
  "Energy",
  "Entrepreneurship",
  "Fashion",
  "Finance",
  "Fintech",
  "Healthcare",
  "Hospitality",
  "Investing",
  "Logistics",
  "Luxury",
  "Marketing",
  "Media",
  "Nonprofit",
  "Professional Services",
  "Real Estate",
  "Technology",
  "Other",
] as const;

export type Industry = (typeof INDUSTRIES)[number];

const INDUSTRY_BY_LABEL = new Map(INDUSTRIES.map((label) => [label.toLowerCase(), label]));

/** Empty string when unset. Null when the value is not in the catalog. */
export function canonicalIndustry(raw: string | null | undefined): Industry | "" | null {
  const value = (raw || "").trim();
  if (!value) return "";
  return INDUSTRY_BY_LABEL.get(value.toLowerCase()) ?? null;
}

export function isLookingFor(value: string): value is LookingFor {
  return (LOOKING_FOR_OPTIONS as readonly string[]).includes(value);
}
