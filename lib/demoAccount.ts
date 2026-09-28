import type { MyProfile } from "./types";

/** Shared "Enter as Mohammed (skip setup)" guest. One profile, not a real member. */
export const SAMPLE_LOGIN_NAME = "Mohammed";
export const SAMPLE_LOGIN_PHONE = "(555) 010-2026";
export const SAMPLE_LOGIN_EMAIL = "demo@conclave.app";
/** Stock photo on that guest card. Walkthrough uses a different picture. */
export const SAMPLE_LOGIN_PHOTO_ID = "1507003211169";
export const SAMPLE_LOGIN_BIO =
  "Building Interlink — private introductions that end at a table.";

/** Ready-made member — skips onboarding for demos / owner bypass. */
export const DEMO_PROFILE: MyProfile = {
  name: SAMPLE_LOGIN_NAME,
  jobTitle: "Founder",
  bio: SAMPLE_LOGIN_BIO,
  photo: `https://images.unsplash.com/photo-${SAMPLE_LOGIN_PHOTO_ID}-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=90`,
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
  phone: SAMPLE_LOGIN_PHONE,
  verifications: [
    {
      method: "company-email",
      value: SAMPLE_LOGIN_EMAIL,
      verifiedAt: new Date().toISOString(),
    },
    {
      method: "linkedin",
      value: "https://linkedin.com/in/conclave-demo",
      verifiedAt: new Date().toISOString(),
    },
    {
      method: "resume",
      value: "https://conclave.app/demo-resume.pdf",
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
