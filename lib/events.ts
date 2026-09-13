import { CITIES } from "./cities";
import type { MeetEvent } from "./eventTypes";
import type { City } from "./types";

function city(name: string): City {
  const found = CITIES.find((c) => c.name === name);
  if (!found) throw new Error(`Unknown city: ${name}`);
  return found;
}

/**
 * Curated Conclave tables. These are product-owned dinners/salons —
 * the same “settled over dinner” surface as private bookings, opened to the room.
 * Dates sit in late 2026 so the catalog stays upcoming for this build.
 */
export const CONCLAVE_TABLES: MeetEvent[] = [
  {
    id: "t-founder-intros-nyc",
    title: "Founder intros, eight seats",
    description:
      "A tight New York dinner for people building companies who want founder introductions — co-founders, first hires, and operators who have shipped. Come ready to say what you’re building and who you still need.",
    topics: ["SaaS", "AI / Machine Learning", "Mobile App Development"],
    audience: ["Co-founder", "Partnership", "Networking"],
    roles: ["founder", "engineer", "product"],
    hostName: "Priya Shah",
    hostRole: "Founder",
    city: city("New York"),
    venueName: "Le Bernardin",
    kind: "dinner",
    startsAt: "2026-10-08T23:00:00.000Z",
    seats: 8,
    keywords: ["founder intros", "startup", "building", "technical partner"],
  },
  {
    id: "t-design-careers-sg",
    title: "Design careers salon",
    description:
      "Portfolio reviews and hiring conversations for product designers breaking into health, fintech, and SaaS. Mentors from shipped consumer apps. If your bio says you’re looking for a design career or a founding designer, this table is for you.",
    topics: ["SaaS", "Health & Fitness", "Web Design & Development"],
    audience: ["Hiring", "Mentor", "Networking"],
    roles: ["designer", "product", "founder"],
    hostName: "Kenji Watanabe",
    hostRole: "Product Designer",
    city: city("Singapore"),
    venueName: "Odette",
    kind: "salon",
    startsAt: "2026-10-16T11:00:00.000Z",
    seats: 10,
    keywords: ["design career", "portfolio", "ux", "ui", "founding designer"],
  },
  {
    id: "t-investor-night-ldn",
    title: "Seed capital night",
    description:
      "Founders raising a first check sit with angels and operators who have written them. Not a pitch circus — eight-minute conversations, then dinner. Looking for an investor or raising seed should put this on your list.",
    topics: ["SaaS", "Fintech", "AI / Machine Learning"],
    audience: ["Investor", "Partnership"],
    roles: ["founder", "investor", "finance"],
    hostName: "Amelia Croft",
    hostRole: "Angel investor",
    city: city("London"),
    venueName: "Core by Clare Smyth",
    kind: "night",
    startsAt: "2026-10-22T18:30:00.000Z",
    seats: 12,
    keywords: ["raising", "seed", "capital", "angel", "check"],
  },
  {
    id: "t-hospitality-cdmx",
    title: "Hospitality operators table",
    description:
      "Owners franchising restaurants, launching a second location, or building a food brand. Partnerships, suppliers, and people who have opened more than one door.",
    topics: ["Food & Restaurants", "Franchising", "E-commerce"],
    audience: ["Partnership", "Clients"],
    roles: ["hospitality", "founder"],
    hostName: "Sofia Alvarez",
    hostRole: "Restaurant Owner",
    city: city("Mexico City"),
    venueName: "Pujol",
    kind: "dinner",
    startsAt: "2026-10-29T01:00:00.000Z",
    seats: 10,
    keywords: ["franchise", "taqueria", "f&b", "second location"],
  },
  {
    id: "t-freight-lagos",
    title: "Freight & trade dinner",
    description:
      "Dispatch platforms, owner-operators, and import/export people comparing West African lanes. For anyone building logistics software or moving freight who wants a co-founder or capital.",
    topics: ["Trucking & Logistics", "Import / Export"],
    audience: ["Co-founder", "Investor", "Partnership"],
    roles: ["ops", "founder", "engineer"],
    hostName: "Dele Okafor",
    hostRole: "Logistics Manager",
    city: city("Lagos"),
    venueName: "Noir",
    kind: "dinner",
    startsAt: "2026-11-05T19:00:00.000Z",
    seats: 10,
    keywords: ["dispatch", "freight", "owner-operator", "lanes"],
  },
  {
    id: "t-wellness-founders-sg",
    title: "Wellness founders supper",
    description:
      "Health and fitness founders who need technical partners, coaches, or a first hire. Habit apps, gyms, and recovery brands — not a general networking mixer.",
    topics: ["Health & Fitness", "SaaS", "Personal Training & Gyms"],
    audience: ["Co-founder", "Hiring", "Partnership"],
    roles: ["founder", "designer", "engineer"],
    hostName: "Lina Park",
    hostRole: "Founder",
    city: city("Singapore"),
    venueName: "Zén",
    kind: "dinner",
    startsAt: "2026-11-12T11:30:00.000Z",
    seats: 8,
    keywords: ["wellness", "habit", "recovery", "technical partner"],
  },
  {
    id: "t-property-miami",
    title: "Property & short-term table",
    description:
      "Realtors, Airbnb hosts, and people flipping or renovating in the same room as operators who have scaled a portfolio. Looking for partners or clients in real estate.",
    topics: ["Real Estate", "Airbnb / Short-Term Rentals", "House Flipping & Renovation"],
    audience: ["Partnership", "Clients", "Networking"],
    roles: ["realestate", "founder", "ops"],
    hostName: "Marcus Hale",
    hostRole: "Broker",
    city: city("Miami"),
    venueName: "Hiden",
    kind: "dinner",
    startsAt: "2026-11-18T23:30:00.000Z",
    seats: 10,
    keywords: ["airbnb", "portfolio", "renovation", "host"],
  },
  {
    id: "t-fashion-paris",
    title: "Brand & atelier night",
    description:
      "Clothing brands, fashion operators, and photographers who want clients or a partnership — not a consumer party. Bring the line you’re shipping.",
    topics: ["Fashion", "Clothing Brand", "Photography & Video"],
    audience: ["Clients", "Partnership", "Hiring"],
    roles: ["designer", "marketing", "founder"],
    hostName: "Camille Renard",
    hostRole: "Creative Director",
    city: city("Paris"),
    venueName: "Le Cinq",
    kind: "night",
    startsAt: "2026-11-20T18:00:00.000Z",
    seats: 10,
    keywords: ["atelier", "lookbook", "apparel", "brand"],
  },
  {
    id: "t-hiring-nyc",
    title: "Builders hiring night",
    description:
      "Founders who are hiring sit with designers, engineers, and operators open to a first role at a young company. If your profile says hiring — or you’re looking for that seat — this is the room.",
    topics: ["SaaS", "AI / Machine Learning", "Web Design & Development"],
    audience: ["Hiring", "Networking"],
    roles: ["founder", "engineer", "designer", "talent"],
    hostName: "Noah Kim",
    hostRole: "CTO",
    city: city("New York"),
    venueName: "Eleven Madison Park",
    kind: "night",
    startsAt: "2026-12-03T23:00:00.000Z",
    seats: 12,
    keywords: ["first hire", "talent", "job", "role"],
  },
  {
    id: "t-mentor-chicago",
    title: "Operator office hours",
    description:
      "Mentors who have scaled a company take eight seats with people who want advice, not a pitch. Bring one decision you’re stuck on.",
    topics: ["SaaS", "E-commerce", "Marketing Agency"],
    audience: ["Mentor", "Networking"],
    roles: ["founder", "ops", "marketing"],
    hostName: "Ruth Ellison",
    hostRole: "Operator",
    city: city("Chicago"),
    venueName: "Smyth",
    kind: "salon",
    startsAt: "2026-12-09T01:00:00.000Z",
    seats: 8,
    keywords: ["advice", "office hours", "stuck", "guidance"],
  },
  {
    id: "t-crypto-dubai",
    title: "Crypto builders circle",
    description:
      "On-chain founders, traders, and protocol people. A poor fit unless you actually work in crypto or web3 — we keep this room precise on purpose.",
    topics: ["Crypto / Web3", "Fintech", "Day Trading & Investing"],
    audience: ["Partnership", "Investor", "Co-founder"],
    roles: ["founder", "engineer", "finance"],
    hostName: "Farid Al-Mansoor",
    hostRole: "Protocol founder",
    city: city("Dubai"),
    venueName: "Trèsind Studio",
    kind: "dinner",
    startsAt: "2026-12-11T16:00:00.000Z",
    seats: 8,
    keywords: ["on-chain", "protocol", "defi", "token"],
  },
  {
    id: "t-fleet-atlanta",
    title: "Fleet owners supper",
    description:
      "Owner-operators buying the next truck, dispatchers, and people financing a first fleet. Real estate on the side is welcome; design careers are not the point.",
    topics: ["Trucking & Logistics", "Real Estate"],
    audience: ["Investor", "Networking", "Partnership"],
    roles: ["ops", "founder", "finance"],
    hostName: "James Carter",
    hostRole: "Owner-operator",
    city: city("Atlanta"),
    venueName: "Bone & Bourbon",
    kind: "dinner",
    startsAt: "2026-12-15T00:00:00.000Z",
    seats: 10,
    keywords: ["fleet", "otr", "dry van", "owner-operator"],
  },
  {
    id: "t-clients-la",
    title: "Agency & clients lunch",
    description:
      "Marketing, content, and brand people who want clients — seated with operators who actually buy. Bring one case, not a deck.",
    topics: ["Marketing Agency", "Content Creation", "Social Media Influencing"],
    audience: ["Clients", "Partnership"],
    roles: ["marketing", "founder"],
    hostName: "Imani Brooks",
    hostRole: "Agency founder",
    city: city("Los Angeles"),
    venueName: "Providence",
    kind: "salon",
    startsAt: "2026-10-14T19:00:00.000Z",
    seats: 10,
    keywords: ["case study", "retainer", "brand", "pipeline"],
  },
  {
    id: "t-partnership-berlin",
    title: "Cross-border partnership salon",
    description:
      "SaaS and marketplace operators looking for a partnership across the Atlantic — distribution, not fundraising. Mentors sit in if the fit is real.",
    topics: ["SaaS", "E-commerce", "Import / Export"],
    audience: ["Partnership", "Networking"],
    roles: ["founder", "ops", "sales"],
    hostName: "Jonas Weber",
    hostRole: "Marketplace founder",
    city: city("Berlin"),
    venueName: "Facil",
    kind: "salon",
    startsAt: "2026-11-07T18:00:00.000Z",
    seats: 10,
    keywords: ["distribution", "marketplace", "cross-border"],
  },
];

export function eventById(id: string): MeetEvent | undefined {
  return CONCLAVE_TABLES.find((e) => e.id === id);
}

export function upcomingTables(now = Date.now()): MeetEvent[] {
  return CONCLAVE_TABLES.filter((e) => {
    const t = Date.parse(e.startsAt);
    return Number.isFinite(t) && t >= now - 6 * 60 * 60 * 1000;
  });
}
