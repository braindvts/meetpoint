import { CITIES } from "./cities";
import type {
  EventCategory,
  EventIndustry,
  InterlinkEvent,
} from "./events";
import { inferLookingFor, inferRoles } from "./eventTaxonomy";
import type { City, LookingFor } from "./types";

export type EventMatchFields = {
  topics: string[];
  audience: LookingFor[];
  roles: string[];
  keywords: string[];
  hostRole: string;
};

/** Industry → canonical idea-tag topics used by people matching. */
export const INDUSTRY_TOPICS: Record<EventIndustry, string[]> = {
  Technology: ["SaaS", "Mobile App Development", "Web Design & Development"],
  AI: ["AI / Machine Learning", "SaaS"],
  Finance: ["Fintech", "Day Trading & Investing"],
  "Real Estate": ["Real Estate"],
  Entrepreneurship: ["SaaS"],
  Healthcare: ["Health & Fitness"],
  Marketing: ["Marketing Agency", "Content Creation"],
  Investing: ["Day Trading & Investing", "Fintech"],
  Luxury: ["Fashion", "Clothing Brand"],
  Business: ["SaaS", "Franchising"],
  "Professional Services": ["Tax & Bookkeeping", "Online Courses & Coaching"],
};

const CATEGORY_AUDIENCE: Record<EventCategory, LookingFor[]> = {
  networking: ["Networking", "Partnership"],
  conference: ["Networking", "Clients"],
  convention: ["Networking", "Partnership"],
  meetup: ["Networking", "Partnership"],
  dinner: ["Partnership", "Networking"],
  workshop: ["Hiring", "Mentor", "Networking"],
  exclusive: ["Partnership", "Investor"],
};

const EXTRA_CITIES: City[] = [
  { name: "San Francisco", country: "USA", lat: 37.7749, lng: -122.4194 },
  { name: "Boston", country: "USA", lat: 42.3601, lng: -71.0589 },
  { name: "Austin", country: "USA", lat: 30.2672, lng: -97.7431 },
  { name: "Washington", country: "USA", lat: 38.9072, lng: -77.0369 },
];

/**
 * Curated signal overlay for the published catalog. Keeps ranking precise
 * without replacing title/description/industry on the Events surface.
 */
export const EVENT_MATCH_OVERLAY: Record<string, Partial<EventMatchFields>> = {
  "evt-black-tie-ny": {
    topics: ["SaaS", "AI / Machine Learning", "Mobile App Development"],
    audience: ["Co-founder", "Partnership", "Networking"],
    roles: ["founder", "engineer", "product"],
    keywords: ["founder intros", "operators", "partnerships", "startup", "building"],
  },
  "evt-ai-summit-sf": {
    topics: ["AI / Machine Learning", "SaaS"],
    audience: ["Partnership", "Clients", "Networking"],
    roles: ["founder", "engineer", "product"],
    keywords: ["researchers", "llm", "enterprise", "machine learning"],
  },
  "evt-fintech-london": {
    topics: ["Fintech", "Day Trading & Investing"],
    audience: ["Investor", "Partnership", "Clients"],
    roles: ["investor", "finance", "founder"],
    keywords: ["allocators", "growth equity", "private credit", "capital"],
  },
  "evt-re-miami": {
    topics: ["Real Estate"],
    audience: ["Partnership", "Clients", "Investor"],
    roles: ["realestate", "investor"],
    keywords: ["developers", "brokers", "lps", "property"],
  },
  "evt-health-boston": {
    topics: ["Health & Fitness"],
    audience: ["Partnership", "Hiring", "Clients"],
    roles: ["founder", "product"],
    keywords: ["clinicians", "digital care", "diagnostics", "healthtech"],
  },
  "evt-mkt-chicago": {
    topics: ["Marketing Agency", "Content Creation", "Web Design & Development"],
    audience: ["Partnership", "Clients", "Networking"],
    roles: ["marketing", "designer", "founder"],
    keywords: ["cmo", "growth", "brand", "design"],
  },
  "evt-invest-nyc": {
    topics: ["Day Trading & Investing", "Fintech"],
    audience: ["Investor", "Partnership"],
    roles: ["investor", "finance"],
    keywords: ["lp", "gp", "private markets", "capital"],
  },
  "evt-tech-austin": {
    topics: ["SaaS", "Mobile App Development", "Web Design & Development"],
    audience: ["Networking", "Partnership", "Hiring"],
    roles: ["founder", "engineer", "product", "designer"],
    keywords: ["builders", "infra", "product", "go-to-market"],
  },
  "evt-lux-paris": {
    topics: ["Fashion", "Clothing Brand"],
    audience: ["Clients", "Partnership"],
    roles: ["founder"],
    keywords: ["luxury", "maison", "private clients"],
  },
  "evt-online-saas": {
    topics: ["SaaS"],
    audience: ["Hiring", "Partnership", "Networking"],
    roles: ["founder", "product", "engineer"],
    keywords: ["retention", "pricing", "operators", "saas"],
  },
  "evt-pro-services-dc": {
    topics: ["Tax & Bookkeeping", "Online Courses & Coaching"],
    audience: ["Partnership", "Clients", "Networking"],
    roles: ["finance"],
    keywords: ["consulting", "legal", "advisory", "partners"],
  },
  "evt-biz-dubai": {
    topics: ["Import / Export", "Franchising", "E-commerce"],
    audience: ["Partnership", "Investor", "Clients"],
    roles: ["founder", "ops", "finance"],
    keywords: ["trade", "family offices", "cross-border", "freight"],
  },
};

function unique<T>(items: T[]): T[] {
  return [...new Set(items.filter(Boolean))];
}

export function eventCity(event: InterlinkEvent): City {
  if (typeof event.lat === "number" && typeof event.lng === "number") {
    return {
      name: event.city,
      country: event.country,
      lat: event.lat,
      lng: event.lng,
    };
  }
  const needle = event.city.trim().toLowerCase();
  const found =
    CITIES.find((c) => c.name.toLowerCase() === needle) ||
    EXTRA_CITIES.find((c) => c.name.toLowerCase() === needle);
  if (found) return found;
  return { name: event.city, country: event.country, lat: 0, lng: 0 };
}

export function isOnlineEvent(event: InterlinkEvent): boolean {
  return event.format === "online" || event.city.toLowerCase() === "online";
}

/** Resolve topics / audience / roles for an Interlink event. */
export function matchFieldsFor(event: InterlinkEvent): EventMatchFields {
  const overlay = EVENT_MATCH_OVERLAY[event.id] || {};
  const blob = [
    event.name,
    event.shortDescription,
    event.description,
    event.industry,
    event.organizer,
    event.organizerTitle,
    ...(event.speakers || []),
    ...(event.companies || []),
  ].join(" ");

  const topics = unique([
    ...(event.topics || []),
    ...(overlay.topics || []),
    ...(event.topics?.length || overlay.topics?.length
      ? []
      : INDUSTRY_TOPICS[event.industry] || []),
  ]);

  const audience = unique([
    ...(event.audience || []),
    ...(overlay.audience || []),
    ...(event.audience?.length || overlay.audience?.length
      ? []
      : [...(CATEGORY_AUDIENCE[event.category] || []), ...inferLookingFor(blob)]),
  ]);

  const roles = unique([
    ...(event.roles || []),
    ...(overlay.roles || []),
    ...(event.roles?.length || overlay.roles?.length
      ? []
      : inferRoles(`${event.organizerTitle || ""} ${blob}`)),
  ]);

  const keywords = unique([
    ...(event.keywords || []),
    ...(overlay.keywords || []),
    event.industry,
    event.category,
    ...(event.companies || []),
  ]);

  const hostRole =
    overlay.hostRole ||
    event.organizerTitle ||
    (roles[0] ? roles[0] : event.organizer);

  return { topics, audience, roles, keywords, hostRole };
}
