import type {
  City,
  LookingFor,
  MeetPreference,
  MeetingRating,
  MyProfile,
  Person,
  Restaurant,
} from "./types";
import { RESTAURANTS } from "./data";
import { summarizeReputation } from "./reputation";
import { tierForPerson, type MemberTier } from "./tiers";

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

/** Job-title keywords that can help someone building a given business idea. */
const JOB_HELP: Record<string, string[]> = {
  "AI / Machine Learning": ["software", "engineer", "developer", "data", "ml", "ai", "cto"],
  SaaS: ["software", "engineer", "developer", "product", "cto", "designer"],
  "Mobile App Development": ["software", "engineer", "developer", "ios", "android", "cto"],
  "Web Design & Development": ["developer", "designer", "engineer", "frontend", "ux"],
  Cybersecurity: ["security", "engineer", "it", "cyber"],
  "IT Services & Repair": ["it", "technician", "engineer", "support"],
  Fintech: ["software", "engineer", "developer", "finance", "analyst", "banker"],
  "E-commerce": ["marketing", "designer", "developer", "seller", "retail", "ops"],
  Dropshipping: ["marketing", "seller", "ops", "logistics", "ecommerce"],
  "Amazon FBA / Reselling": ["seller", "ops", "logistics", "amazon", "retail"],
  "Print on Demand": ["designer", "marketing", "seller", "print"],
  "Clothing Brand": ["designer", "marketing", "fashion", "stylist", "seller"],
  Fashion: ["designer", "stylist", "buyer", "marketing", "fashion"],
  "Marketing Agency": ["marketing", "growth", "brand", "content", "advertising"],
  "Content Creation": ["content", "creator", "writer", "producer", "editor"],
  "YouTube / Streaming": ["creator", "editor", "producer", "videographer"],
  Podcasting: ["producer", "editor", "host", "audio"],
  "Photography & Video": ["photographer", "videographer", "editor", "producer"],
  "Social Media Influencing": ["creator", "influencer", "marketing", "brand"],
  "Food & Restaurants": ["chef", "restaurant", "cook", "hospitality", "food"],
  "Food Truck": ["chef", "cook", "restaurant", "food", "caterer"],
  Catering: ["chef", "caterer", "cook", "event", "food"],
  "Coffee Shop / Café": ["barista", "café", "cafe", "restaurant", "hospitality"],
  "Meal Prep & Nutrition": ["nutrition", "chef", "trainer", "dietitian", "food"],
  "Real Estate": ["realtor", "broker", "agent", "property", "real estate"],
  "Airbnb / Short-Term Rentals": ["realtor", "property", "host", "hospitality", "manager"],
  "House Flipping & Renovation": ["contractor", "realtor", "construction", "renovation", "architect"],
  "Construction & Contracting": ["contractor", "builder", "construction", "architect", "engineer"],
  "Trucking & Logistics": ["driver", "logistics", "fleet", "ops", "dispatcher"],
  "Import / Export": ["logistics", "trade", "ops", "import", "export"],
  "Health & Fitness": ["trainer", "coach", "fitness", "physio", "wellness"],
  "Personal Training & Gyms": ["trainer", "coach", "fitness", "gym"],
  "Day Trading & Investing": ["trader", "analyst", "broker", "finance", "advisor"],
  "Stocks & Options Trading": ["trader", "analyst", "broker", "finance", "advisor"],
  "Forex Trading": ["trader", "analyst", "broker", "finance"],
  "Dividend & Long-Term Investing": ["advisor", "analyst", "finance", "planner"],
  "Crypto / Web3": ["developer", "engineer", "trader", "crypto", "blockchain"],
  "Tax & Bookkeeping": ["accountant", "bookkeeper", "cpa", "tax", "finance"],
  "Credit Repair": ["credit", "finance", "advisor", "consultant"],
  Insurance: ["broker", "agent", "underwriter", "insurance"],
  Education: ["teacher", "tutor", "professor", "educator", "coach"],
  "Tutoring & Test Prep": ["tutor", "teacher", "educator", "coach"],
  "Online Courses & Coaching": ["coach", "educator", "consultant", "teacher"],
  "Event Planning": ["planner", "coordinator", "event", "hospitality"],
  "Wedding Services": ["planner", "florist", "photographer", "coordinator"],
  "Beauty & Barbering": ["barber", "stylist", "beautician", "esthetician"],
  "Barbershop / Salon Owner": ["barber", "stylist", "salon", "beautician"],
  "Nail Tech & Lashes": ["nail", "lash", "beautician", "technician"],
  "Green Energy": ["engineer", "solar", "energy", "electrician"],
  "Cleaning Services": ["cleaner", "ops", "manager", "janitor"],
  "Landscaping & Lawn Care": ["landscaper", "gardener", "grounds"],
  "Auto Detailing & Car Care": ["detailer", "mechanic", "auto"],
  "Car Rental / Turo": ["ops", "fleet", "manager", "rental"],
  "Gaming": ["developer", "designer", "producer", "streamer"],
  Music: ["producer", "musician", "artist", "engineer", "manager"],
  Sports: ["coach", "athlete", "trainer", "agent", "scout"],
  Travel: ["agent", "guide", "hospitality", "concierge"],
  Franchising: ["consultant", "ops", "franchise", "manager"],
  "Nonprofit & Community": ["director", "fundraiser", "organizer", "nonprofit"],
};

/**
 * Business ideas that meaningfully help another idea —
 * e.g. Marketing Agency helps Clothing Brand.
 */
const IDEA_HELP: Record<string, string[]> = {
  "Marketing Agency": [
    "E-commerce",
    "Clothing Brand",
    "Fashion",
    "Food & Restaurants",
    "Food Truck",
    "SaaS",
    "Mobile App Development",
    "Real Estate",
    "Content Creation",
    "Beauty & Barbering",
    "Barbershop / Salon Owner",
    "Personal Training & Gyms",
  ],
  "Web Design & Development": [
    "E-commerce",
    "SaaS",
    "Marketing Agency",
    "Clothing Brand",
    "Food & Restaurants",
    "Real Estate",
  ],
  "Mobile App Development": ["SaaS", "AI / Machine Learning", "Fintech", "Health & Fitness"],
  "AI / Machine Learning": ["SaaS", "Fintech", "Health & Fitness", "Marketing Agency"],
  SaaS: ["E-commerce", "Fintech", "Real Estate", "Health & Fitness"],
  "Content Creation": [
    "Clothing Brand",
    "Fashion",
    "E-commerce",
    "Personal Training & Gyms",
    "Food & Restaurants",
    "YouTube / Streaming",
  ],
  "Photography & Video": [
    "Clothing Brand",
    "Fashion",
    "Real Estate",
    "Wedding Services",
    "Event Planning",
    "Airbnb / Short-Term Rentals",
  ],
  "Tax & Bookkeeping": [
    "E-commerce",
    "Real Estate",
    "Food & Restaurants",
    "Trucking & Logistics",
    "Construction & Contracting",
    "Franchising",
  ],
  "Credit Repair": ["Real Estate", "Day Trading & Investing", "Stocks & Options Trading"],
  "Trucking & Logistics": [
    "E-commerce",
    "Amazon FBA / Reselling",
    "Import / Export",
    "Dropshipping",
    "Food & Restaurants",
  ],
  "Construction & Contracting": [
    "House Flipping & Renovation",
    "Real Estate",
    "Airbnb / Short-Term Rentals",
  ],
  "Event Planning": ["Wedding Services", "Catering", "Food & Restaurants"],
  Catering: ["Event Planning", "Wedding Services", "Food & Restaurants"],
  Insurance: ["Real Estate", "Trucking & Logistics", "Construction & Contracting"],
};

/** Whose lookingFor complements mine — intentional introductions. */
const INTENT_COMPLEMENT: Record<LookingFor, LookingFor[]> = {
  "Co-founder": ["Co-founder", "Partnership", "Hiring"],
  Investor: ["Clients", "Partnership", "Hiring", "Networking"],
  Mentor: ["Networking", "Partnership", "Hiring", "Clients"],
  Clients: ["Hiring", "Partnership", "Networking", "Clients"],
  Hiring: ["Clients", "Networking", "Partnership", "Co-founder"],
  Partnership: ["Partnership", "Clients", "Investor", "Co-founder", "Networking"],
  Networking: ["Networking", "Partnership", "Clients", "Hiring", "Mentor", "Co-founder"],
};

export interface MatchResult {
  person: Person;
  score: number;
  sharedIdeas: string[];
  sameBusiness: boolean;
  canHelp: boolean;
  helpReasons: string[];
  sameJob: boolean;
  sharedLookingFor: LookingFor[];
  intentFit: boolean;
  reputationScore: number;
  reputationStatus: "standing" | "caution" | "hidden";
  tier: MemberTier | null;
  distance: number;
  isLocal: boolean;
  reachable: boolean;
}

function normalizeJob(job: string): string {
  return job.trim().toLowerCase();
}

function jobCanHelpIdeas(jobTitle: string, myIdeas: string[]): string[] {
  const job = normalizeJob(jobTitle);
  const reasons: string[] = [];
  for (const idea of myIdeas) {
    const keywords = JOB_HELP[idea] || [];
    if (keywords.some((k) => job.includes(k))) {
      reasons.push(idea);
    }
  }
  return reasons;
}

/** Their business ideas that can help mine (complementary skills). */
function theirIdeasHelpMine(myIdeas: string[], theirIdeas: string[]): string[] {
  const reasons: string[] = [];
  for (const theirs of theirIdeas) {
    const helps = IDEA_HELP[theirs] || [];
    const overlap = helps.filter((h) => myIdeas.includes(h));
    if (overlap.length > 0) {
      reasons.push(theirs);
    }
  }
  return reasons;
}

export function scoreMatch(
  me: MyProfile,
  person: Person,
  ratings: MeetingRating[] = []
): MatchResult {
  const sharedIdeas = person.ideaTags.filter((t) => me.ideaTags.includes(t));
  const sameBusiness = sharedIdeas.length > 0;
  const sameJob = normalizeJob(me.jobTitle) === normalizeJob(person.jobTitle);

  const jobHelp = jobCanHelpIdeas(person.jobTitle, me.ideaTags);
  const ideaHelp = theirIdeasHelpMine(me.ideaTags, person.ideaTags);
  const helpReasons = [...new Set([...jobHelp, ...ideaHelp])];
  const canHelp = helpReasons.length > 0;

  const myLooking = me.lookingFor || [];
  const theirLooking = person.lookingFor || [];
  const sharedLookingFor = theirLooking.filter((t) => myLooking.includes(t));
  const complementary = myLooking.some((mine) =>
    (INTENT_COMPLEMENT[mine] || []).some((c) => theirLooking.includes(c))
  );
  const intentFit = sharedLookingFor.length > 0 || complementary;

  const reputation = summarizeReputation(person.id, ratings);
  const tier = tierForPerson(person, reputation);

  const distance = distanceKm(me.city, person.city);
  const isLocal = distance <= LOCAL_RADIUS_KM;
  const sameCountry = me.city.country === person.city.country;

  const meReach =
    me.travel === "worldwide" || (me.travel === "country" && sameCountry) || isLocal;
  const theyReach =
    person.travel === "worldwide" || (person.travel === "country" && sameCountry) || isLocal;
  const reachable = meReach || theyReach;

  let score = 0;
  score += sharedLookingFor.length * 28;
  if (complementary) score += 22;
  score += sharedIdeas.length * 30;
  if (canHelp) score += 18 + Math.min(helpReasons.length, 2) * 4;
  if (sameJob) score += sameBusiness || canHelp || intentFit ? 10 : 14;
  if (isLocal) score += 10;
  else if (sameCountry) score += 5;
  if (person.travel === "worldwide") score += 3;

  // Reputation / tier lifts or lowers visibility
  if (reputation.status === "caution") score = Math.round(score * 0.55);
  else if (tier === 4) score += 12;
  else if (tier === 3) score += 10;
  else if (reputation.score >= 85) score += 8;
  else if (reputation.score < 70) score -= 10;

  return {
    person,
    score: Math.max(0, Math.min(score, 100)),
    sharedIdeas,
    sameBusiness,
    canHelp,
    helpReasons,
    sameJob,
    sharedLookingFor,
    intentFit,
    reputationScore: reputation.score,
    reputationStatus: reputation.status,
    tier,
    distance,
    isLocal,
    reachable,
  };
}

/** Same business model, complementary help, or same profession — the “For you” merge. */
export function isRelevantMatch(m: MatchResult): boolean {
  return m.sameBusiness || m.canHelp || m.sameJob;
}

/**
 * Prefer people who share a business model, can help, or share a profession.
 * Looking-for intent still ranks higher when present. Hidden standing is removed.
 */
export function rankMatches(
  me: MyProfile,
  people: Person[],
  ratings: MeetingRating[] = []
): MatchResult[] {
  if (!me.lookingFor?.length) return [];

  return people
    .map((p) => scoreMatch(me, p, ratings))
    .filter(
      (m) =>
        m.reachable &&
        m.reputationStatus !== "hidden" &&
        (isRelevantMatch(m) || m.intentFit)
    )
    .sort((a, b) => {
      const pref = (m: MatchResult) =>
        (m.sameBusiness ? 5 : 0) +
        (m.canHelp ? 4 : 0) +
        (m.sameJob ? 3 : 0) +
        (m.sharedLookingFor.length ? 2 : 0) +
        (m.intentFit ? 1 : 0) +
        (m.reputationStatus === "standing" ? 1 : 0);
      return (
        pref(b) - pref(a) ||
        b.reputationScore - a.reputationScore ||
        b.score - a.score ||
        a.distance - b.distance
      );
    });
}

export function filterByPreference(
  matches: MatchResult[],
  preference: MeetPreference | "local"
): MatchResult[] {
  switch (preference) {
    case "local":
      return matches.filter((m) => m.isLocal && isRelevantMatch(m));
    case "same-business":
    case "can-help":
    case "same-profession":
    case "open":
    default:
      // For you = merged same-business + can-help + same-profession
      return matches.filter(isRelevantMatch);
  }
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
