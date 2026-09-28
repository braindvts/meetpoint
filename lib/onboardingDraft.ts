import { CITIES } from "./cities";
import { IDEA_TAGS } from "./data";
import { IDEA_TAG_LIMIT, canonicalIndustry, partitionIdeaTags } from "./interests";
import type { City, LookingFor, MyProfile } from "./types";
import { LOOKING_FOR_OPTIONS } from "./types";

/** Limits from the profile API. Keep these aligned with `profileUpdateSchema`. */
export const PROFILE_LIMITS = {
  name: 80,
  headline: 120,
  company: 120,
  bio: 800,
  tags: IDEA_TAG_LIMIT,
  lookingFor: 8,
} as const;

export const ONBOARDING_STEPS = [
  { id: "basics", label: "Basics" },
  { id: "work", label: "Work" },
  { id: "goals", label: "Goals" },
  { id: "interests", label: "Interests" },
  { id: "bio", label: "Bio" },
] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number]["id"];

export interface OnboardingDraft {
  name: string;
  photo: string;
  jobTitle: string;
  company: string;
  industry: string;
  city: City;
  lookingFor: LookingFor[];
  ideaTags: string[];
  bio: string;
}

export type FieldErrors = Partial<
  Record<
    "name" | "photo" | "jobTitle" | "company" | "industry" | "city" | "lookingFor" | "ideaTags" | "bio",
    string
  >
>;

/**
 * Canonical interests, grouped for the picker.
 * Labels match IDEA_TAGS exactly. Grouping is display-only.
 */
export const INTEREST_GROUPS: { id: string; label: string; tags: readonly string[] }[] = [
  {
    id: "technology",
    label: "Technology",
    tags: [
      "AI / Machine Learning",
      "SaaS",
      "Mobile App Development",
      "Web Design & Development",
      "Cybersecurity",
      "IT Services & Repair",
      "Drones & Aerial Services",
      "3D Printing",
      "Crypto / Web3",
    ],
  },
  {
    id: "commerce",
    label: "Commerce",
    tags: [
      "E-commerce",
      "Dropshipping",
      "Amazon FBA / Reselling",
      "Print on Demand",
      "Clothing Brand",
      "Vending Machines",
      "Import / Export",
      "Marketing Agency",
    ],
  },
  {
    id: "food",
    label: "Food & hospitality",
    tags: [
      "Food & Restaurants",
      "Food Truck",
      "Catering",
      "Coffee Shop / Café",
      "Meal Prep & Nutrition",
    ],
  },
  {
    id: "property",
    label: "Property & trades",
    tags: [
      "Real Estate",
      "Airbnb / Short-Term Rentals",
      "House Flipping & Renovation",
      "Construction & Contracting",
      "Cleaning Services",
      "Landscaping & Lawn Care",
    ],
  },
  {
    id: "money",
    label: "Money",
    tags: [
      "Fintech",
      "Day Trading & Investing",
      "Stocks & Options Trading",
      "Forex Trading",
      "Dividend & Long-Term Investing",
      "Credit Repair",
      "Insurance",
      "Tax & Bookkeeping",
    ],
  },
  {
    id: "creative",
    label: "Creative",
    tags: [
      "Content Creation",
      "Photography & Video",
      "Podcasting",
      "YouTube / Streaming",
      "Social Media Influencing",
      "Music",
      "Fashion",
      "Beauty & Barbering",
    ],
  },
  {
    id: "services",
    label: "Services",
    tags: [
      "Notary & Mobile Services",
      "Event Planning",
      "Wedding Services",
      "Tutoring & Test Prep",
      "Online Courses & Coaching",
      "Childcare & Daycare",
      "Senior & Home Care",
      "Pet Services & Grooming",
      "Barbershop / Salon Owner",
      "Nail Tech & Lashes",
      "Personal Training & Gyms",
      "Auto Detailing & Car Care",
      "Car Rental / Turo",
    ],
  },
  {
    id: "living",
    label: "Living & impact",
    tags: [
      "Health & Fitness",
      "Education",
      "Travel",
      "Gaming",
      "Sports",
      "Green Energy",
      "Trucking & Logistics",
      "Agriculture & Farming",
      "Nonprofit & Community",
      "Franchising",
    ],
  },
];

export function interestGroupCoverage(): { missing: string[]; duplicate: string[] } {
  const seen = new Map<string, number>();
  for (const group of INTEREST_GROUPS) {
    for (const tag of group.tags) {
      seen.set(tag, (seen.get(tag) || 0) + 1);
    }
  }
  const missing = IDEA_TAGS.filter((tag) => !seen.has(tag));
  const duplicate = [...seen.entries()].filter(([, n]) => n > 1).map(([tag]) => tag);
  return { missing, duplicate };
}

const DEFAULT_CITY = CITIES[0];

export function emptyDraft(base?: Partial<MyProfile> | null): OnboardingDraft {
  const city = base?.city?.name ? base.city : DEFAULT_CITY;
  return {
    name: base?.name || "",
    photo: base?.photo || "",
    jobTitle: base?.jobTitle || "",
    company: base?.company || "",
    industry: base?.industry || "",
    city,
    lookingFor: [...(base?.lookingFor || [])],
    ideaTags: [...(base?.ideaTags || [])],
    bio: base?.bio || "",
  };
}

export function draftToProfile(draft: OnboardingDraft, base: MyProfile | null): MyProfile {
  const industry = canonicalIndustry(draft.industry) || "";
  return {
    ...(base || {
      travel: "worldwide",
      meetPreference: "open",
      verifications: [],
    }),
    name: draft.name.trim(),
    jobTitle: draft.jobTitle.trim(),
    company: draft.company.trim(),
    industry,
    bio: draft.bio.trim(),
    photo: draft.photo,
    city: draft.city,
    lookingFor: draft.lookingFor.filter((item) =>
      (LOOKING_FOR_OPTIONS as readonly string[]).includes(item)
    ),
    ideaTags: partitionIdeaTags(draft.ideaTags).labels,
    travel: base?.travel || "worldwide",
    meetPreference: base?.meetPreference || "open",
    verifications: base?.verifications || [],
  };
}

function tooLong(value: string, max: number, label: string): string | undefined {
  if (value.trim().length > max) return `${label} can be up to ${max} characters.`;
  return undefined;
}

export function validateBasics(draft: OnboardingDraft): FieldErrors {
  const errors: FieldErrors = {};
  const name = draft.name.trim();
  if (!name) errors.name = "Enter your name.";
  else {
    const over = tooLong(draft.name, PROFILE_LIMITS.name, "Name");
    if (over) errors.name = over;
  }
  if (!draft.photo) errors.photo = "Add a photo.";
  else if (draft.photo.length > 2_000_000) errors.photo = "That photo is too large. Try a smaller image.";
  const title = draft.jobTitle.trim();
  if (!title) errors.jobTitle = "Enter your headline.";
  else {
    const over = tooLong(draft.jobTitle, PROFILE_LIMITS.headline, "Headline");
    if (over) errors.jobTitle = over;
  }
  const companyOver = tooLong(draft.company, PROFILE_LIMITS.company, "Company");
  if (companyOver) errors.company = companyOver;
  return errors;
}

export function validateWork(draft: OnboardingDraft): FieldErrors {
  const errors: FieldErrors = {};
  if (canonicalIndustry(draft.industry) === null) {
    errors.industry = "Choose an industry from the list.";
  }
  if (!draft.city?.name?.trim()) errors.city = "Choose a city.";
  return errors;
}

export function validateGoals(draft: OnboardingDraft): FieldErrors {
  const errors: FieldErrors = {};
  if (draft.lookingFor.length === 0) errors.lookingFor = "Choose what you’re looking for.";
  else if (draft.lookingFor.length > PROFILE_LIMITS.lookingFor) {
    errors.lookingFor = `Choose up to ${PROFILE_LIMITS.lookingFor}.`;
  }
  return errors;
}

export function validateInterests(draft: OnboardingDraft): FieldErrors {
  const errors: FieldErrors = {};
  const tags = partitionIdeaTags(draft.ideaTags).labels;
  if (tags.length === 0) errors.ideaTags = "Add at least one interest.";
  else if (draft.ideaTags.length > PROFILE_LIMITS.tags || tags.length > PROFILE_LIMITS.tags) {
    errors.ideaTags = `Up to ${PROFILE_LIMITS.tags} interests.`;
  }
  return errors;
}

export function validateBio(draft: OnboardingDraft): FieldErrors {
  const errors: FieldErrors = {};
  const over = tooLong(draft.bio, PROFILE_LIMITS.bio, "Bio");
  if (over) errors.bio = over;
  return errors;
}

const STEP_VALIDATORS = [
  validateBasics,
  validateWork,
  validateGoals,
  validateInterests,
  validateBio,
] as const;

export function validateStep(index: number, draft: OnboardingDraft): FieldErrors {
  const fn = STEP_VALIDATORS[index];
  return fn ? fn(draft) : {};
}

export function validateAll(draft: OnboardingDraft): FieldErrors {
  return Object.assign({}, ...STEP_VALIDATORS.map((fn) => fn(draft)));
}

/** First step that still fails validation. Null when the draft can be finished. */
export function firstIncompleteStep(draft: OnboardingDraft): number | null {
  for (let i = 0; i < STEP_VALIDATORS.length; i++) {
    // Bio is optional. Only hold the member there when it is too long.
    if (i === STEP_VALIDATORS.length - 1) {
      if (Object.keys(validateBio(draft)).length > 0) return i;
      continue;
    }
    if (Object.keys(STEP_VALIDATORS[i](draft)).length > 0) return i;
  }
  return null;
}

/**
 * Where to reopen the wizard.
 * A stored step wins when earlier steps are already valid.
 * No stored step and a finished identity means they are not in the wizard.
 */
export function resumeStep(
  draft: OnboardingDraft,
  stored: number | "done" | null
): number | "done" {
  const first = firstIncompleteStep(draft);
  if (stored === "done") return first === null ? "done" : first;
  if (typeof stored === "number" && stored >= 0) {
    const clamped = Math.min(stored, ONBOARDING_STEPS.length - 1);
    if (first !== null && first < clamped) return first;
    return clamped;
  }
  return first === null ? "done" : first;
}

export function stepIdToIndex(id: string | null | undefined): number | null {
  if (!id) return null;
  const index = ONBOARDING_STEPS.findIndex((step) => step.id === id);
  return index >= 0 ? index : null;
}

export interface MatchingItem {
  id: string;
  label: string;
  hint: string;
  done: boolean;
}

/** Fields that change who Discover and events can rank you with. */
export function matchingProgress(profile: Pick<
  MyProfile,
  "name" | "photo" | "jobTitle" | "industry" | "city" | "lookingFor" | "ideaTags" | "bio"
> | null | undefined): { items: MatchingItem[]; doneCount: number; total: number } {
  const draft = emptyDraft(profile || null);
  const interests = draft.ideaTags.length;
  const bio = draft.bio.trim().length;
  const items: MatchingItem[] = [
    {
      id: "photo",
      label: "Photo",
      hint: "Add a photo",
      done: !!draft.photo,
    },
    {
      id: "name",
      label: "Name",
      hint: "Add your name",
      done: !!draft.name.trim(),
    },
    {
      id: "headline",
      label: "Headline",
      hint: "Add your headline",
      done: !!draft.jobTitle.trim(),
    },
    {
      id: "industry",
      label: "Industry",
      hint: "Add your industry",
      done: !!draft.industry.trim() && canonicalIndustry(draft.industry) !== null,
    },
    {
      id: "looking",
      label: "Looking for",
      hint: "Choose what you’re looking for",
      done: draft.lookingFor.length > 0,
    },
    {
      id: "interests",
      label: "Interests",
      hint: interests === 0 ? "Add interests" : "Add a few more interests",
      done: interests >= 3,
    },
    {
      id: "bio",
      label: "Bio",
      hint: "Write a short bio",
      done: bio >= 40,
    },
  ];
  const doneCount = items.filter((item) => item.done).length;
  return { items, doneCount, total: items.length };
}
