import type { Person, PersonWork, VerificationMethod } from "./types";

const OWNER_TITLE = /\b(owner|founder|co-founder|cofounder|ceo|proprietor|principal)\b/i;

export function isOwner(person: Person): boolean {
  if (OWNER_TITLE.test(person.jobTitle || "")) return true;
  return (person.work || []).some((w) => w.kind === "company");
}

export function ownedCompanies(person: Person): PersonWork[] {
  const work = person.work || [];
  const companies = work.filter((w) => w.kind === "company");
  if (companies.length) return companies;
  if (OWNER_TITLE.test(person.jobTitle || "")) {
    return work.filter((w) => w.kind === "app" || w.kind === "product" || w.kind === "website");
  }
  return [];
}

export function otherWork(person: Person): PersonWork[] {
  const owned = new Set(ownedCompanies(person).map((w) => `${w.kind}:${w.title}`));
  return (person.work || []).filter((w) => !owned.has(`${w.kind}:${w.title}`));
}

export function ownerHeadline(person: Person): string | null {
  const owned = ownedCompanies(person);
  if (!owned.length) return null;
  if (owned.length === 1) return `Owns ${owned[0].title}`;
  return `Owns ${owned[0].title} + ${owned.length - 1} more`;
}

export const VERIFY_LABEL: Record<VerificationMethod, string> = {
  "company-email": "Work email",
  linkedin: "LinkedIn",
  website: "Website",
  registration: "Business registration",
  portfolio: "Portfolio",
};
