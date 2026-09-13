import type { MyProfile } from "./types";

/**
 * Local walkthrough profile template. Mailbox and password come from
 * server-only env (see lib/walkthroughOwner.ts) — never from this file.
 */
export const WALKTHROUGH_OWNER_PROFILE: MyProfile = {
  name: "Walkthrough",
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
      method: "company-email",
      value: "",
      verifiedAt: new Date().toISOString(),
    },
    {
      method: "linkedin",
      value: "https://linkedin.com/in/conclave-walkthrough",
      verifiedAt: new Date().toISOString(),
    },
    {
      method: "resume",
      value: "https://conclave.app/walkthrough-resume.pdf",
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

/** @deprecated Use WALKTHROUGH_OWNER_PROFILE — kept for existing imports. */
export const DEMO_OWNER_PROFILE = WALKTHROUGH_OWNER_PROFILE;
