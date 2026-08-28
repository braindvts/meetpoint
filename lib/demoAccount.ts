import type { MyProfile } from "./types";

/** Ready-made member — skips onboarding for demos / owner bypass. */
export const DEMO_PROFILE: MyProfile = {
  name: "Mohammed",
  jobTitle: "Founder",
  bio: "Building Conclave — private introductions that end at a table.",
  photo:
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=90",
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
      value: "https://linkedin.com/in/conclave-demo",
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
