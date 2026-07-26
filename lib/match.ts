import type { City, MyProfile, Person, Restaurant } from "./types";
import { RESTAURANTS } from "./data";

const EARTH_RADIUS_KM = 6371;

export function distanceKm(a: City, b: City): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export const LOCAL_RADIUS_KM = 100;

export interface MatchResult {
  person: Person;
  score: number;
  sharedIdeas: string[];
  sameJob: boolean;
  distance: number;
  isLocal: boolean;
  reachable: boolean;
}

function normalizeJob(job: string): string {
  return job.trim().toLowerCase();
}

export function scoreMatch(me: MyProfile, person: Person): MatchResult {
  const sharedIdeas = person.ideaTags.filter((t) => me.ideaTags.includes(t));
  const sameJob = normalizeJob(me.jobTitle) === normalizeJob(person.jobTitle);
  const distance = distanceKm(me.city, person.city);
  const isLocal = distance <= LOCAL_RADIUS_KM;
  const sameCountry = me.city.country === person.city.country;

  // A match is reachable when the travel preferences of both sides allow meeting.
  const meReach = me.travel === "worldwide" || (me.travel === "country" && sameCountry) || isLocal;
  const theyReach =
    person.travel === "worldwide" || (person.travel === "country" && sameCountry) || isLocal;
  const reachable = meReach || theyReach;

  let score = 0;
  score += sharedIdeas.length * 35;
  if (sameJob) score += 30;
  if (isLocal) score += 20;
  else if (sameCountry) score += 10;
  if (person.travel === "worldwide") score += 5;

  return { person, score: Math.min(score, 100), sharedIdeas, sameJob, distance, isLocal, reachable };
}

export function rankMatches(me: MyProfile, people: Person[]): MatchResult[] {
  return people
    .map((p) => scoreMatch(me, p))
    .filter((m) => m.score > 0 && m.reachable)
    .sort((a, b) => b.score - a.score || a.distance - b.distance);
}

export function restaurantsInCity(cityName: string): Restaurant[] {
  return RESTAURANTS.filter((r) => r.city === cityName);
}

/** Restaurants closest to the geographic midpoint between two cities. */
export function midpointRestaurants(a: City, b: City, limit = 6): Restaurant[] {
  const mid: City = {
    name: "midpoint",
    country: "",
    lat: (a.lat + b.lat) / 2,
    lng: (a.lng + b.lng) / 2,
  };
  return [...RESTAURANTS]
    .sort(
      (r1, r2) =>
        distanceKm(mid, { name: "", country: "", lat: r1.lat, lng: r1.lng }) -
        distanceKm(mid, { name: "", country: "", lat: r2.lat, lng: r2.lng })
    )
    .slice(0, limit);
}

export function formatDistance(km: number): string {
  if (km < 1) return "same neighborhood";
  if (km < LOCAL_RADIUS_KM) return `${Math.round(km)} km away`;
  return `${Math.round(km).toLocaleString()} km away`;
}
