import type { MyProfile } from "./types";

/** Public demo identity — safe to import from client components. */
export const DEMO_OWNER_EMAIL = "brianasome@gmail.com";

export const DEMO_OWNER_FLAG_KEY = "conclave.demoOwner";

/** Ready-made Brian profile — skips onboarding on first sign-in. */
export const DEMO_OWNER_PROFILE: MyProfile = {
  name: "Brian",
  jobTitle: "Founder",
  bio: "Building Interlink — private introductions that end at a table.",
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
      method: "company-email",
      value: "brianasome@gmail.com",
      verifiedAt: new Date().toISOString(),
    },
    {
      method: "linkedin",
      value: "https://linkedin.com/in/conclave-owner-brian",
      verifiedAt: new Date().toISOString(),
    },
    {
      method: "resume",
      value: "https://conclave.app/brian-resume.pdf",
      verifiedAt: new Date().toISOString(),
    },
  ],
  meetingsAttended: 2,
};

export function isDemoOwnerEmail(email: string): boolean {
  return email.trim().toLowerCase() === DEMO_OWNER_EMAIL;
}
