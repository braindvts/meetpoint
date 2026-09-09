import type { Member } from "@prisma/client";
import type {
  LookingFor,
  MeetPreference,
  MyProfile,
  Person,
  PersonWork,
  TravelRange,
  Verification,
} from "./types";

export function memberToProfile(m: Member): MyProfile {
  return {
    name: m.name,
    jobTitle: m.jobTitle,
    bio: m.bio,
    photo: m.photo,
    city: {
      name: m.cityName,
      country: m.cityCountry,
      lat: m.cityLat,
      lng: m.cityLng,
    },
    travel: (m.travel as TravelRange) || "worldwide",
    meetPreference: (m.meetPreference as MeetPreference) || "open",
    lookingFor: safeJson<LookingFor[]>(m.lookingForJson, []),
    ideaTags: safeJson<string[]>(m.ideaTagsJson, []),
    verifications: safeJson<Verification[]>(m.verificationsJson, []),
    work: safeJson<PersonWork[]>(
      "workJson" in m ? String((m as { workJson?: string }).workJson || "[]") : "[]",
      []
    ),
    phone: m.phone || undefined,
    linkedInId: m.linkedInId || undefined,
    black: m.black || undefined,
    blackSince: m.blackSince ? m.blackSince.toISOString() : undefined,
    blackSource: (m.blackSource as MyProfile["blackSource"]) || undefined,
    meetingsAttended: m.meetingsAttended,
    premierPlan: m.premierActive
      ? {
          active: true,
          startedAt: m.premierStartedAt || new Date().toISOString(),
          interval: (m.premierInterval as "month" | "year") || "month",
          trialEndsAt: m.premierTrialEndsAt || undefined,
        }
      : undefined,
  };
}

export function memberToPerson(m: Member): Person {
  const vers = safeJson<Verification[]>(m.verificationsJson, []);
  return {
    id: m.id,
    name: m.name,
    jobTitle: m.jobTitle,
    bio: m.bio,
    photoUrl: m.photo,
    city: {
      name: m.cityName,
      country: m.cityCountry,
      lat: m.cityLat,
      lng: m.cityLng,
    },
    travel: (m.travel as TravelRange) || "worldwide",
    lookingFor: safeJson<LookingFor[]>(m.lookingForJson, []),
    ideaTags: safeJson<string[]>(m.ideaTagsJson, []),
    verifications: vers.map((v) => v.method),
    linkedInUrl:
      vers.find((v) => v.method === "linkedin" && v.value.startsWith("http"))?.value ||
      (m.linkedInId ? `https://www.linkedin.com/in/${m.linkedInId}` : undefined),
    websiteUrl: vers.find((v) => v.method === "website")?.value,
    portfolioUrl: vers.find((v) => v.method === "portfolio")?.value,
    work: safeJson<PersonWork[]>(
      "workJson" in m ? String((m as { workJson?: string }).workJson || "[]") : "[]",
      []
    ),
    black: m.black || undefined,
  };
}

/**
 * Fields a member may write about themselves.
 * Privileged standing fields are NEVER taken from the client:
 * black*, meetingsAttended, premier*, verifications (use /api/verify).
 */
export function profileToMemberData(profile: MyProfile) {
  return {
    name: profile.name,
    jobTitle: profile.jobTitle || "",
    bio: profile.bio || "",
    photo: profile.photo || "",
    cityName: profile.city.name,
    cityCountry: profile.city.country,
    cityLat: profile.city.lat,
    cityLng: profile.city.lng,
    travel: profile.travel,
    meetPreference: profile.meetPreference || "open",
    lookingForJson: JSON.stringify(profile.lookingFor || []),
    ideaTagsJson: JSON.stringify(profile.ideaTags || []),
    workJson: JSON.stringify(profile.work || []),
    phone: profile.phone || null,
  };
}

/** Server-only: merge verifications without letting clients invent standing. */
export function verificationsToJson(verifications: Verification[]): string {
  return JSON.stringify(verifications || []);
}

function safeJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
