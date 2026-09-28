import { distanceKm, LOCAL_RADIUS_KM } from "./match";
import { canonicalInterests } from "./interests";
import { inferRoles } from "./eventTaxonomy";
import type { LookingFor } from "./types";

/**
 * People-to-people ranking.
 * Shared canonical interests are the strongest signal, then complementary
 * "looking for" intent, then industry / role, then city.
 */
const COMPLEMENT: Record<LookingFor, LookingFor[]> = {
  "Co-founder": ["Co-founder", "Partnership", "Hiring"],
  Investor: ["Co-founder", "Partnership"],
  Mentor: ["Co-founder", "Hiring", "Networking"],
  Clients: ["Partnership", "Hiring"],
  Hiring: ["Co-founder", "Networking", "Partnership"],
  Partnership: ["Partnership", "Co-founder", "Investor", "Clients"],
  Networking: ["Networking", "Mentor", "Partnership", "Co-founder"],
};

export interface MatchSubject {
  id?: string;
  jobTitle?: string;
  company?: string;
  industry?: string;
  bio?: string;
  lookingFor?: readonly string[];
  /** Canonical interest labels. `ideaTags` is accepted as the same list. */
  interests?: readonly string[];
  ideaTags?: readonly string[];
  city?: { name?: string; country?: string; lat?: number; lng?: number };
  cityName?: string;
  cityCountry?: string;
  cityLat?: number;
  cityLng?: number;
  updatedAt?: Date | string | number | null;
}

export interface PeopleRank<T> {
  person: T;
  score: number;
  reasons: string[];
  sharedInterests: string[];
  intentFit: boolean;
  sameIndustry: boolean;
  sameRole: boolean;
  distanceKm: number;
  isLocal: boolean;
  /** 2 shared interests, 1 other signal, 0 newest-member fallback. */
  tier: number;
}

function labelsOf(subject: MatchSubject): string[] {
  return canonicalInterests([...(subject.interests || []), ...(subject.ideaTags || [])]).map(
    (item) => item.label
  );
}

function lookingOf(subject: MatchSubject): LookingFor[] {
  return (subject.lookingFor || []).filter((item): item is LookingFor => item in COMPLEMENT);
}

function cityOf(subject: MatchSubject): { name: string; country: string; lat: number; lng: number } | null {
  const name = subject.city?.name || subject.cityName || "";
  const country = subject.city?.country || subject.cityCountry || "";
  const lat = subject.city?.lat ?? subject.cityLat;
  const lng = subject.city?.lng ?? subject.cityLng;
  if (!name || lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { name, country, lat, lng };
}

function recency(person: MatchSubject): number {
  const raw = person.updatedAt;
  if (raw == null || raw === "") return 0;
  const time = raw instanceof Date ? raw.getTime() : typeof raw === "number" ? raw : Date.parse(raw);
  return Number.isFinite(time) ? time : 0;
}

function complementary(mine: LookingFor[], theirs: LookingFor[]): string[] {
  const lines: string[] = [];
  for (const want of mine) {
    const fit = (COMPLEMENT[want] || []).find((item) => theirs.includes(item));
    if (fit) lines.push(`${want} ↔ ${fit}`);
  }
  return lines;
}

export function sharedInterestReason(labels: string[]): string | null {
  if (!labels.length) return null;
  const shown = labels.slice(0, 3).join(", ");
  const noun = labels.length === 1 ? "shared interest" : "shared interests";
  return `${labels.length} ${noun}: ${shown}`;
}

export function rankPeople<T extends MatchSubject>(
  me: MatchSubject,
  people: readonly T[]
): PeopleRank<T>[] {
  const myLabels = labelsOf(me);
  const myLooking = lookingOf(me);
  const myCity = cityOf(me);
  const myIndustry = (me.industry || "").trim().toLowerCase();
  const myJob = (me.jobTitle || "").trim().toLowerCase();
  const myRoles = new Set(inferRoles(`${me.jobTitle || ""} ${me.company || ""}`));

  const ranked: PeopleRank<T>[] = [];

  for (const person of people) {
    if (me.id && person.id && me.id === person.id) continue;

    const theirLabels = labelsOf(person);
    const shared = myLabels.filter((label) => theirLabels.includes(label));
    const pairs = complementary(myLooking, lookingOf(person));
    const theirIndustry = (person.industry || "").trim().toLowerCase();
    const sameIndustry = !!myIndustry && myIndustry === theirIndustry && myIndustry !== "other";
    const theirJob = (person.jobTitle || "").trim().toLowerCase();
    const theirRoles = inferRoles(`${person.jobTitle || ""} ${person.company || ""}`);
    const sharedRole = theirRoles.find((role) => myRoles.has(role));
    const sameRole = (!!myJob && myJob === theirJob) || !!sharedRole;

    const theirCity = cityOf(person);
    let distance = Number.POSITIVE_INFINITY;
    let isLocal = false;
    let sameCity = false;
    if (myCity && theirCity) {
      distance = distanceKm(
        { name: myCity.name, country: myCity.country, lat: myCity.lat, lng: myCity.lng },
        { name: theirCity.name, country: theirCity.country, lat: theirCity.lat, lng: theirCity.lng }
      );
      sameCity = myCity.name.trim().toLowerCase() === theirCity.name.trim().toLowerCase();
      isLocal = sameCity || distance <= LOCAL_RADIUS_KM;
    }

    let score = 0;
    score += Math.min(shared.length, 4) * 30;
    if (shared.length > 4) score += (shared.length - 4) * 8;
    if (pairs.length) score += 18;
    if (sameIndustry) score += 12;
    if (sameRole) score += 10;
    if (isLocal) score += 8;

    const reasons: string[] = [];
    const interestLine = sharedInterestReason(shared);
    if (interestLine) reasons.push(interestLine);
    if (pairs.length) reasons.push(`Complementary intent: ${pairs[0]}`);
    if (sameIndustry) reasons.push(`Same industry: ${person.industry}`);
    if (sameRole) {
      reasons.push(sharedRole ? `Same role: ${sharedRole}` : `Same role: ${person.jobTitle}`);
    }
    if (sameCity && theirCity) reasons.push(`Same city: ${theirCity.name}`);
    else if (isLocal && theirCity) reasons.push(`Nearby: ${theirCity.name}`);

    const tier = shared.length > 0 ? 2 : score > 0 ? 1 : 0;
    if (tier === 0) reasons.push("Recently joined");

    ranked.push({
      person,
      score,
      reasons,
      sharedInterests: shared,
      intentFit: pairs.length > 0,
      sameIndustry,
      sameRole,
      distanceKm: distance,
      isLocal,
      tier,
    });
  }

  ranked.sort((a, b) => {
    return (
      b.tier - a.tier ||
      b.score - a.score ||
      recency(b.person) - recency(a.person) ||
      b.sharedInterests.length - a.sharedInterests.length ||
      a.distanceKm - b.distanceKm ||
      (a.person.id || "").localeCompare(b.person.id || "")
    );
  });

  return ranked;
}
