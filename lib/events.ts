/**
 * Events & Conventions — centralized types + curated mock catalog.
 * Swap EVENTS for a real API later without changing UI components.
 */

import type { LookingFor } from "./types";

export type EventFormat = "in-person" | "online" | "hybrid";

export type EventCategory =
  | "networking"
  | "conference"
  | "convention"
  | "meetup"
  | "dinner"
  | "workshop"
  | "exclusive";

export type EventIndustry =
  | "Technology"
  | "Finance"
  | "Real Estate"
  | "Entrepreneurship"
  | "Healthcare"
  | "Marketing"
  | "AI"
  | "Business"
  | "Investing"
  | "Luxury"
  | "Professional Services";

export interface InterlinkEvent {
  id: string;
  /** event | convention — conventions are larger multi-day gatherings */
  kind: "event" | "convention";
  name: string;
  slug: string;
  image: string;
  category: EventCategory;
  industry: EventIndustry;
  format: EventFormat;
  startsAt: string; // ISO
  endsAt: string;
  venue: string;
  city: string;
  country: string;
  address?: string;
  lat?: number;
  lng?: number;
  description: string;
  shortDescription: string;
  organizer: string;
  organizerTitle?: string;
  registrationUrl?: string;
  expectedAttendance?: number;
  interestedCount: number;
  attendeeCount: number;
  /** Optional member/demo person ids for “connections attending” */
  attendeeIds: string[];
  featured?: boolean;
  exclusive?: boolean;
  speakers?: string[];
  companies?: string[];
  published?: boolean;
  /** Canonical idea-tag topics for ranking (optional; inferred when omitted). */
  topics?: string[];
  /** lookingFor vocabulary this room is seating. */
  audience?: LookingFor[];
  /** Role families the host is seating (founder, designer, engineer, …). */
  roles?: string[];
  /** Extra matching tokens that are not shown as chips. */
  keywords?: string[];
}

export const EVENT_CATEGORIES: { id: EventCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "networking", label: "Networking" },
  { id: "conference", label: "Conferences" },
  { id: "convention", label: "Conventions" },
  { id: "meetup", label: "Meetups" },
  { id: "dinner", label: "Dinners" },
  { id: "workshop", label: "Workshops" },
  { id: "exclusive", label: "Exclusive" },
];

export const EVENT_INDUSTRIES: EventIndustry[] = [
  "Technology",
  "Finance",
  "Real Estate",
  "Entrepreneurship",
  "Healthcare",
  "Marketing",
  "AI",
  "Business",
  "Investing",
  "Luxury",
  "Professional Services",
];

export const CATEGORY_LABEL: Record<EventCategory, string> = {
  networking: "Networking",
  conference: "Conference",
  convention: "Convention",
  meetup: "Meetup",
  dinner: "Business dinner",
  workshop: "Workshop",
  exclusive: "Exclusive",
};

/** Curated mock catalog — replace with API later. */
export const EVENTS: InterlinkEvent[] = [
  {
    id: "evt-black-tie-ny",
    kind: "event",
    name: "Founders’ Table — Midtown",
    slug: "founders-table-midtown",
    image: "/events/founders-table-midtown.jpg",
    category: "dinner",
    industry: "Entrepreneurship",
    format: "in-person",
    startsAt: "2026-10-03T19:00:00-04:00",
    endsAt: "2026-10-03T22:00:00-04:00",
    venue: "The Modern",
    city: "New York",
    country: "USA",
    address: "9 W 53rd St, New York, NY",
    lat: 40.7614,
    lng: -73.9776,
    shortDescription: "Twelve seats. No decks. Serious operators only.",
    description:
      "An invitation-only dinner for founders and operators who prefer a table to a stage. Expect sharp conversation, quiet introductions, and the kind of follow-ups that turn into partnerships. Interlink members with Verified standing get priority seating.",
    organizer: "Interlink Hosts",
    organizerTitle: "Private dinners",
    expectedAttendance: 12,
    interestedCount: 86,
    attendeeCount: 9,
    attendeeIds: ["p1", "p2", "p3"],
    featured: true,
    exclusive: true,
    published: true,
  },
  {
    id: "evt-ai-summit-sf",
    kind: "convention",
    name: "Pacific AI Summit",
    slug: "pacific-ai-summit",
    image: "/events/pacific-ai-summit.jpg",
    category: "convention",
    industry: "AI",
    format: "in-person",
    startsAt: "2026-11-12T09:00:00-08:00",
    endsAt: "2026-11-14T18:00:00-08:00",
    venue: "Moscone Center",
    city: "San Francisco",
    country: "USA",
    address: "747 Howard St, San Francisco, CA",
    lat: 37.784,
    lng: -122.401,
    shortDescription: "Three days with the people building the next decade of AI.",
    description:
      "Pacific AI Summit brings researchers, founders, and enterprise buyers into one curated floor. Keynotes by morning, closed-door roundtables by afternoon. Use Interlink to see who from your network is on-site before you walk the hall.",
    organizer: "Pacific Forums",
    organizerTitle: "Convention producer",
    registrationUrl: "https://example.com/pacific-ai",
    expectedAttendance: 4200,
    interestedCount: 1280,
    attendeeCount: 640,
    attendeeIds: ["p4", "p5"],
    featured: true,
    speakers: ["Dr. Lena Park", "Marcus Chen", "Aisha Rahman"],
    companies: ["Anthropic", "Scale", "Databricks"],
    published: true,
  },
  {
    id: "evt-fintech-london",
    kind: "event",
    name: "City Capital Forum",
    slug: "city-capital-forum",
    image: "/events/city-capital-forum.jpg",
    category: "conference",
    industry: "Finance",
    format: "in-person",
    startsAt: "2026-10-21T08:30:00+01:00",
    endsAt: "2026-10-22T17:00:00+01:00",
    venue: "Guildhall",
    city: "London",
    country: "UK",
    shortDescription: "Allocators, founders, and operators under one roof in the City.",
    description:
      "Two days of focused capital conversations — growth equity, private credit, and fintech infrastructure. Designed for decision-makers, not spectators.",
    organizer: "City Capital Media",
    registrationUrl: "https://example.com/city-capital",
    expectedAttendance: 900,
    interestedCount: 412,
    attendeeCount: 210,
    attendeeIds: ["p6"],
    featured: true,
    published: true,
  },
  {
    id: "evt-re-miami",
    kind: "event",
    name: "Waterfront Deal Room",
    slug: "waterfront-deal-room",
    image: "/events/waterfront-deal-room.jpg",
    category: "networking",
    industry: "Real Estate",
    format: "in-person",
    startsAt: "2026-09-28T17:30:00-04:00",
    endsAt: "2026-09-28T20:30:00-04:00",
    venue: "Faena Forum",
    city: "Miami",
    country: "USA",
    shortDescription: "Developers, LPs, and brokers — introductions with intent.",
    description:
      "An evening for real estate principals who want warm intros, not badge scans. Short briefings, then open circulation with Interlink hosts facilitating the right conversations.",
    organizer: "Interlink Real Estate Circle",
    interestedCount: 154,
    attendeeCount: 48,
    attendeeIds: ["p7", "p8"],
    published: true,
  },
  {
    id: "evt-health-boston",
    kind: "event",
    name: "Beacon Health Innovation Day",
    slug: "beacon-health-innovation",
    image: "/events/beacon-health-innovation.jpg",
    category: "conference",
    industry: "Healthcare",
    format: "hybrid",
    startsAt: "2026-10-08T09:00:00-04:00",
    endsAt: "2026-10-08T17:30:00-04:00",
    venue: "Seaport World Trade Center",
    city: "Boston",
    country: "USA",
    shortDescription: "Clinicians, founders, and payers mapping the next care stack.",
    description:
      "A single intense day covering digital care, diagnostics, and hospital operations. Hybrid stream available for remote members; in-room seats reserved for Verified profiles.",
    organizer: "Beacon Health Collective",
    interestedCount: 298,
    attendeeCount: 120,
    attendeeIds: [],
    published: true,
  },
  {
    id: "evt-mkt-chicago",
    kind: "event",
    name: "Brand Operators’ Circle",
    slug: "brand-operators-circle",
    image: "/events/brand-operators-circle.jpg",
    category: "meetup",
    industry: "Marketing",
    format: "in-person",
    startsAt: "2026-09-24T18:00:00-05:00",
    endsAt: "2026-09-24T21:00:00-05:00",
    venue: "Soho House Chicago",
    city: "Chicago",
    country: "USA",
    shortDescription: "CMOs and growth leads — no agency pitches.",
    description:
      "A standing monthly circle for brand and growth leaders. One short case, then conversation. Interlink surfaces who else from your network RSVP’d.",
    organizer: "Interlink Marketing",
    interestedCount: 67,
    attendeeCount: 22,
    attendeeIds: ["p2"],
    published: true,
  },
  {
    id: "evt-invest-nyc",
    kind: "event",
    name: "Private Markets Evening",
    slug: "private-markets-evening",
    image: "/events/private-markets-evening.jpg",
    category: "exclusive",
    industry: "Investing",
    format: "in-person",
    startsAt: "2026-10-15T18:30:00-04:00",
    endsAt: "2026-10-15T21:30:00-04:00",
    venue: "The Yale Club",
    city: "New York",
    country: "USA",
    shortDescription: "LPs and GPs in a room built for trust, not theater.",
    description:
      "Closed guest list. Brief market notes, then facilitated introductions. BLACK members receive early access to the room.",
    organizer: "Interlink Capital Desk",
    interestedCount: 201,
    attendeeCount: 40,
    attendeeIds: ["p1", "p9"],
    featured: true,
    exclusive: true,
    published: true,
  },
  {
    id: "evt-tech-austin",
    kind: "convention",
    name: "South Corridor Tech Week",
    slug: "south-corridor-tech-week",
    image: "/events/south-corridor-tech-week.jpg",
    category: "convention",
    industry: "Technology",
    format: "in-person",
    startsAt: "2026-11-02T10:00:00-05:00",
    endsAt: "2026-11-05T18:00:00-05:00",
    venue: "Austin Convention Center",
    city: "Austin",
    country: "USA",
    shortDescription: "Builders week — product, infra, and go-to-market under one pass.",
    description:
      "Four days spanning product, infrastructure, and growth. Satellite dinners hosted by Interlink for members who want quieter introductions after the floor closes.",
    organizer: "Corridor Events",
    registrationUrl: "https://example.com/corridor-tech",
    expectedAttendance: 8500,
    interestedCount: 2100,
    attendeeCount: 1100,
    attendeeIds: ["p3", "p4", "p10"],
    speakers: ["Jordan Lee", "Priya Nair"],
    companies: ["Stripe", "Notion", "Cloudflare"],
    published: true,
  },
  {
    id: "evt-lux-paris",
    kind: "event",
    name: "Maison Circle — Paris",
    slug: "maison-circle-paris",
    image: "/events/maison-circle-paris.jpg",
    category: "exclusive",
    industry: "Luxury",
    format: "in-person",
    startsAt: "2026-10-29T19:00:00+02:00",
    endsAt: "2026-10-29T23:00:00+02:00",
    venue: "Hôtel de Crillon",
    city: "Paris",
    country: "France",
    shortDescription: "Maison leaders and private clients — evening salon.",
    description:
      "An intimate salon for luxury house executives and private client advisors. Dress code: black tie optional. Photography restricted.",
    organizer: "Maison Partners",
    interestedCount: 94,
    attendeeCount: 28,
    attendeeIds: [],
    exclusive: true,
    published: true,
  },
  {
    id: "evt-online-saas",
    kind: "event",
    name: "SaaS Operators Roundtable",
    slug: "saas-operators-roundtable",
    image: "/events/saas-operators-roundtable.jpg",
    category: "workshop",
    industry: "Business",
    format: "online",
    startsAt: "2026-09-30T12:00:00-04:00",
    endsAt: "2026-09-30T13:30:00-04:00",
    venue: "Interlink Live",
    city: "Online",
    country: "Global",
    shortDescription: "90 minutes with operators who have shipped through the messy middle.",
    description:
      "A live roundtable on retention, pricing, and hiring. Camera-on preferred. Recordings are not distributed — show up or miss it.",
    organizer: "Interlink Academy",
    interestedCount: 320,
    attendeeCount: 95,
    attendeeIds: ["p5"],
    published: true,
  },
  {
    id: "evt-pro-services-dc",
    kind: "event",
    name: "Capitol Advisors Breakfast",
    slug: "capitol-advisors-breakfast",
    image: "/events/capitol-advisors-breakfast.jpg",
    category: "meetup",
    industry: "Professional Services",
    format: "in-person",
    startsAt: "2026-10-07T07:45:00-04:00",
    endsAt: "2026-10-07T09:15:00-04:00",
    venue: "The Hay-Adams",
    city: "Washington",
    country: "USA",
    shortDescription: "Partners and principals before the city wakes up.",
    description:
      "A working breakfast for consulting, legal, and advisory leaders. One topic, sharp facilitation, and room to book follow-up dinners through Interlink.",
    organizer: "Interlink DC",
    interestedCount: 58,
    attendeeCount: 18,
    attendeeIds: [],
    published: true,
  },
  {
    id: "evt-biz-dubai",
    kind: "convention",
    name: "Gulf Commerce Convention",
    slug: "gulf-commerce-convention",
    image: "/events/gulf-commerce-convention.jpg",
    category: "convention",
    industry: "Business",
    format: "in-person",
    startsAt: "2026-12-01T09:00:00+04:00",
    endsAt: "2026-12-03T18:00:00+04:00",
    venue: "Dubai World Trade Centre",
    city: "Dubai",
    country: "UAE",
    shortDescription: "Cross-border commerce, capital, and family offices.",
    description:
      "Three days spanning trade, capital formation, and regional expansion. Interlink hosts a members’ lounge for quiet meetings between sessions.",
    organizer: "Gulf Commerce Authority",
    registrationUrl: "https://example.com/gulf-commerce",
    expectedAttendance: 6000,
    interestedCount: 980,
    attendeeCount: 400,
    attendeeIds: [],
    companies: ["Emirates NBD", "Mubadala", "DP World"],
    published: true,
  },
];

export function getPublishedEvents(): InterlinkEvent[] {
  return EVENTS.filter((e) => e.published !== false);
}

export function getEventById(id: string): InterlinkEvent | undefined {
  return EVENTS.find((e) => e.id === id || e.slug === id);
}

export function getConventions(): InterlinkEvent[] {
  return getPublishedEvents().filter((e) => e.kind === "convention" || e.category === "convention");
}

export function getFeaturedEvents(): InterlinkEvent[] {
  return getPublishedEvents().filter((e) => e.featured);
}

export function getUpcomingSorted(list: InterlinkEvent[] = getPublishedEvents()): InterlinkEvent[] {
  return [...list].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
  );
}

export function getPopularEvents(): InterlinkEvent[] {
  return [...getPublishedEvents()].sort(
    (a, b) => b.interestedCount + b.attendeeCount - (a.interestedCount + a.attendeeCount)
  );
}

export function eventsNearCity(city: string): InterlinkEvent[] {
  const q = city.trim().toLowerCase();
  if (!q) return getUpcomingSorted();
  return getUpcomingSorted().filter(
    (e) => e.city.toLowerCase().includes(q) || e.country.toLowerCase().includes(q)
  );
}

export function relatedEvents(event: InterlinkEvent, limit = 3): InterlinkEvent[] {
  return getUpcomingSorted()
    .filter(
      (e) =>
        e.id !== event.id &&
        (e.industry === event.industry || e.category === event.category || e.city === event.city)
    )
    .slice(0, limit);
}

/** Prefer the calendar date encoded in an offset ISO string (venue-local). */
function venueDateParts(iso: string): { y: number; m: number; d: number; h: number; min: number } | null {
  const m = iso.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2})?(?:\.\d+)?([+-]\d{2}:?\d{2}|Z)?/
  );
  if (!m) return null;
  return {
    y: Number(m[1]),
    m: Number(m[2]),
    d: Number(m[3]),
    h: Number(m[4]),
    min: Number(m[5]),
  };
}

export function formatEventDate(iso: string): string {
  const parts = venueDateParts(iso);
  const d = parts
    ? new Date(Date.UTC(parts.y, parts.m - 1, parts.d, 12, 0, 0))
    : new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatEventTime(iso: string): string {
  const parts = venueDateParts(iso);
  if (parts) {
    const h24 = parts.h;
    const min = parts.min;
    const ampm = h24 >= 12 ? "PM" : "AM";
    const h12 = h24 % 12 || 12;
    return `${h12}:${String(min).padStart(2, "0")} ${ampm}`;
  }
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatEventRange(start: string, end: string): string {
  const a = venueDateParts(start);
  const b = venueDateParts(end);
  const sameDay =
    a && b
      ? a.y === b.y && a.m === b.m && a.d === b.d
      : (() => {
          const s = new Date(start);
          const e = new Date(end);
          return (
            s.getFullYear() === e.getFullYear() &&
            s.getMonth() === e.getMonth() &&
            s.getDate() === e.getDate()
          );
        })();
  if (sameDay) {
    return `${formatEventDate(start)} · ${formatEventTime(start)} – ${formatEventTime(end)}`;
  }
  return `${formatEventDate(start)} – ${formatEventDate(end)}`;
}

export type EventDateWindow = "all" | "week" | "month" | "quarter";

export type EventFilters = {
  query?: string;
  category?: EventCategory | "all";
  industry?: EventIndustry | "all";
  format?: EventFormat | "all";
  city?: string;
  kind?: "event" | "convention" | "all";
  dateWindow?: EventDateWindow;
};

export function filterEvents(
  list: InterlinkEvent[],
  filters: EventFilters
): InterlinkEvent[] {
  const q = (filters.query || "").trim().toLowerCase();
  const now = Date.now();
  let until = Infinity;
  if (filters.dateWindow === "week") until = now + 7 * 86400000;
  else if (filters.dateWindow === "month") until = now + 30 * 86400000;
  else if (filters.dateWindow === "quarter") until = now + 90 * 86400000;

  return list.filter((e) => {
    if (filters.kind && filters.kind !== "all") {
      const isConvention = e.kind === "convention" || e.category === "convention";
      if (filters.kind === "convention" && !isConvention) return false;
      if (filters.kind === "event" && isConvention) return false;
    }
    if (filters.category && filters.category !== "all" && e.category !== filters.category) {
      return false;
    }
    if (filters.industry && filters.industry !== "all" && e.industry !== filters.industry) {
      return false;
    }
    if (filters.format && filters.format !== "all" && e.format !== filters.format) {
      return false;
    }
    if (filters.city) {
      const c = filters.city.toLowerCase();
      if (c === "online") {
        if (e.format !== "online" && e.city.toLowerCase() !== "online") return false;
      } else if (
        !e.city.toLowerCase().includes(c) &&
        !e.country.toLowerCase().includes(c)
      ) {
        return false;
      }
    }
    if (filters.dateWindow && filters.dateWindow !== "all") {
      const t = new Date(e.startsAt).getTime();
      if (t < now - 86400000 || t > until) return false;
    }
    if (q) {
      const hay = [
        e.name,
        e.shortDescription,
        e.description,
        e.city,
        e.venue,
        e.organizer,
        e.industry,
        e.category,
        ...(e.speakers || []),
        ...(e.companies || []),
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
