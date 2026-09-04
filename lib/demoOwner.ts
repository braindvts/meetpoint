import type { MyProfile } from "./types";

/** Fixed demo login for walkthroughs — always available. */
export const DEMO_OWNER_EMAIL = "brianasome@gmail.com";
export const DEMO_OWNER_PASSWORD = "Brian812";

export const DEMO_OWNER_FLAG_KEY = "conclave.demoOwner";

/** Ready-made Brian profile — skips onboarding on first sign-in. */
export const DEMO_OWNER_PROFILE: MyProfile = {
  name: "Brian",
  jobTitle: "Founder",
  bio: "Building Conclave — private introductions that end at a table.",
  photo:
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=90",
  city: {
    name: "New York",
    country: "USA",
    lat: 40.7128,
    lng: -74.006,
  },
  travel: "worldwide",
  meetPreference: "open",
  lookingFor: ["Co-founder", "Investor", "Partnership", "Networking"],
  ideaTags: ["SaaS", "Fintech", "AI / Machine Learning"],
  phone: "(555) 010-2026",
  verifications: [
    {
      method: "linkedin",
      value: "https://linkedin.com/in/conclave-brian-demo",
      verifiedAt: new Date().toISOString(),
    },
  ],
  meetingsAttended: 2,
  premierPlan: {
    active: true,
    startedAt: new Date().toISOString(),
    interval: "year",
    trialEndsAt: new Date(Date.now() + 3 * 86400000).toISOString(),
  },
};

export function isDemoOwnerEmail(email: string): boolean {
  return email.trim().toLowerCase() === DEMO_OWNER_EMAIL;
}

export function isDemoOwnerPassword(password: string): boolean {
  return password === DEMO_OWNER_PASSWORD;
}
