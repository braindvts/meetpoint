import type { LookingFor } from "./types";

/** Role families inferred from job titles, bios, and event audience copy. */
export const ROLE_FAMILIES: Record<string, string[]> = {
  founder: [
    "founder",
    "cofounder",
    "co-founder",
    "ceo",
    "owner",
    "operator",
    "entrepreneur",
    "builder",
    "solopreneur",
  ],
  engineer: [
    "engineer",
    "developer",
    "software",
    "swe",
    "cto",
    "programmer",
    "fullstack",
    "backend",
    "frontend",
    "devops",
    "ml",
    "data",
  ],
  designer: [
    "designer",
    "design",
    "ux",
    "ui",
    "product design",
    "creative director",
    "visual",
    "brand designer",
  ],
  investor: ["investor", "vc", "angel", "capital", "gp", "limited partner", "venture"],
  product: ["product manager", "product", "pm", "cpo", "roadmap"],
  marketing: [
    "marketing",
    "growth",
    "brand",
    "cmo",
    "content",
    "advertising",
    "copywriter",
    "influencer",
  ],
  sales: ["sales", "account executive", "business development", "bd", "ae"],
  finance: [
    "analyst",
    "banker",
    "cfo",
    "accountant",
    "trader",
    "advisor",
    "bookkeeper",
    "cpa",
  ],
  ops: ["operations", "ops", "logistics", "manager", "dispatcher", "fleet"],
  hospitality: [
    "chef",
    "restaurateur",
    "restaurant",
    "hospitality",
    "barista",
    "cook",
    "caterer",
  ],
  realestate: ["realtor", "broker", "property", "real estate", "landlord", "developer"],
  talent: ["recruiter", "talent", "hiring", "people", "hr"],
  educator: ["teacher", "tutor", "professor", "coach", "educator"],
};

/**
 * Topic clusters — related ideaTags share a neighborhood so
 * “SaaS” can still meet “AI / Machine Learning” without exact equality.
 */
export const TOPIC_CLUSTERS: Record<string, string[]> = {
  tech: [
    "AI / Machine Learning",
    "SaaS",
    "Mobile App Development",
    "Web Design & Development",
    "Cybersecurity",
    "IT Services & Repair",
    "Crypto / Web3",
    "Gaming",
    "3D Printing",
    "Drones & Aerial Services",
  ],
  commerce: [
    "E-commerce",
    "Dropshipping",
    "Amazon FBA / Reselling",
    "Print on Demand",
    "Clothing Brand",
    "Fashion",
  ],
  food: [
    "Food & Restaurants",
    "Food Truck",
    "Catering",
    "Coffee Shop / Café",
    "Meal Prep & Nutrition",
  ],
  finance: [
    "Fintech",
    "Day Trading & Investing",
    "Stocks & Options Trading",
    "Forex Trading",
    "Dividend & Long-Term Investing",
    "Credit Repair",
    "Tax & Bookkeeping",
    "Insurance",
  ],
  property: [
    "Real Estate",
    "Airbnb / Short-Term Rentals",
    "House Flipping & Renovation",
    "Construction & Contracting",
  ],
  health: ["Health & Fitness", "Personal Training & Gyms", "Meal Prep & Nutrition"],
  creative: [
    "Content Creation",
    "YouTube / Streaming",
    "Podcasting",
    "Photography & Video",
    "Music",
    "Social Media Influencing",
    "Web Design & Development",
  ],
  logistics: ["Trucking & Logistics", "Import / Export"],
  beauty: ["Beauty & Barbering", "Barbershop / Salon Owner", "Nail Tech & Lashes"],
  services: [
    "Cleaning Services",
    "Landscaping & Lawn Care",
    "Auto Detailing & Car Care",
    "Car Rental / Turo",
    "Event Planning",
    "Wedding Services",
    "Tutoring & Test Prep",
    "Online Courses & Coaching",
    "Childcare & Daycare",
    "Pet Services & Grooming",
    "Notary & Mobile Services",
  ],
  energy: ["Green Energy"],
  community: ["Nonprofit & Community", "Education", "Franchising", "Travel", "Sports"],
};

/** Extra aliases so free-text “ML”, “F&B”, “proptech” still hit catalog topics. */
export const TOPIC_ALIASES: Record<string, string[]> = {
  "AI / Machine Learning": ["ai", "ml", "machine learning", "llm", "gpt", "artificial intelligence"],
  SaaS: ["saas", "software", "b2b", "platform"],
  "Mobile App Development": ["ios", "android", "mobile", "app"],
  "Web Design & Development": ["web", "frontend", "website", "ux"],
  Fintech: ["fintech", "payments", "banking"],
  "E-commerce": ["ecommerce", "e-commerce", "dtc", "d2c", "shopify"],
  "Food & Restaurants": ["restaurant", "food", "f&b", "hospitality", "dining"],
  "Real Estate": ["real estate", "property", "proptech", "realtor"],
  "Health & Fitness": ["wellness", "fitness", "health", "healthtech"],
  Fashion: ["fashion", "apparel", "clothing"],
  "Clothing Brand": ["streetwear", "brand", "apparel"],
  "Trucking & Logistics": ["trucking", "freight", "dispatch", "logistics"],
  "Import / Export": ["trade", "import", "export"],
  "Crypto / Web3": ["crypto", "web3", "blockchain", "defi"],
  "Marketing Agency": ["marketing", "growth", "agency"],
  "Content Creation": ["content", "creator", "media"],
  Education: ["education", "edtech", "teaching"],
  "Day Trading & Investing": ["trading", "investing", "markets"],
};

export const INTENT_ALIASES: Record<LookingFor, string[]> = {
  "Co-founder": [
    "cofounder",
    "co-founder",
    "co founder",
    "technical cofounder",
    "technical partner",
    "founding partner",
    "founder intro",
    "founder intros",
    "startup partner",
  ],
  Investor: [
    "investor",
    "investors",
    "vc",
    "angel",
    "raise",
    "raising",
    "seed",
    "capital",
    "funding",
    "check",
  ],
  Mentor: ["mentor", "mentors", "advice", "guidance", "coach", "office hours"],
  Clients: ["clients", "customers", "pipeline", "buyers", "accounts"],
  Hiring: ["hiring", "hire", "recruit", "talent", "team", "headcount", "job"],
  Partnership: ["partnership", "partner", "collab", "collaboration", "joint venture"],
  Networking: ["networking", "network", "intros", "introductions", "meet people", "connect"],
};

export const STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "of",
  "to",
  "in",
  "on",
  "for",
  "with",
  "at",
  "by",
  "from",
  "as",
  "is",
  "are",
  "was",
  "be",
  "this",
  "that",
  "it",
  "i",
  "im",
  "i'm",
  "my",
  "we",
  "our",
  "you",
  "your",
  "who",
  "what",
  "into",
  "over",
  "after",
  "about",
  "than",
  "then",
  "also",
  "just",
  "very",
  "more",
  "some",
  "any",
  "all",
  "not",
  "but",
  "if",
  "so",
  "do",
  "am",
  "me",
]);

export function clusterOf(tag: string): string | null {
  for (const [name, tags] of Object.entries(TOPIC_CLUSTERS)) {
    if (tags.includes(tag)) return name;
  }
  return null;
}

export function relatedTopics(tag: string): string[] {
  const cluster = clusterOf(tag);
  if (!cluster) return [];
  return TOPIC_CLUSTERS[cluster].filter((t) => t !== tag);
}

export function normalizeToken(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9+#/&\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(text: string): string[] {
  const cleaned = normalizeToken(text);
  if (!cleaned) return [];
  const parts = cleaned.split(/[\s/&,+_-]+/).filter((t) => t.length > 1 && !STOPWORDS.has(t));
  const bigrams: string[] = [];
  for (let i = 0; i < parts.length - 1; i++) {
    bigrams.push(`${parts[i]} ${parts[i + 1]}`);
  }
  return [...parts, ...bigrams];
}

export function inferRoles(text: string): string[] {
  const hay = normalizeToken(text);
  if (!hay) return [];
  const hits: string[] = [];
  for (const [role, aliases] of Object.entries(ROLE_FAMILIES)) {
    if (aliases.some((a) => hay.includes(a))) hits.push(role);
  }
  return hits;
}

export function inferLookingFor(text: string): LookingFor[] {
  const hay = normalizeToken(text);
  if (!hay) return [];
  const hits: LookingFor[] = [];
  for (const [intent, aliases] of Object.entries(INTENT_ALIASES) as [LookingFor, string[]][]) {
    if (aliases.some((a) => hay.includes(a))) hits.push(intent);
  }
  return hits;
}

export function expandTopicTokens(tag: string): string[] {
  const aliases = TOPIC_ALIASES[tag] || [];
  return [...tokenize(tag), ...aliases.map(normalizeToken)];
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Short aliases ("ai") must be whole tokens — never a substring of "Airbnb". */
export function tokensAlign(a: string, b: string): boolean {
  const left = normalizeToken(a);
  const right = normalizeToken(b);
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.length <= 2 || right.length <= 2) return false;
  const re = new RegExp(`(?:^|\\s)${escapeRe(left)}(?:\\s|$)`);
  return re.test(right);
}

export function topicAliasesHit(interest: string, topic: string): boolean {
  const fromInterest = expandTopicTokens(interest);
  const fromTopic = expandTopicTokens(topic);
  for (const a of fromInterest) {
    if (fromTopic.some((t) => tokensAlign(a, t))) return true;
    if (a.length > 3 && tokensAlign(a, topic)) return true;
  }
  return false;
}
