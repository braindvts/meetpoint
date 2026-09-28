import type { Member } from "@prisma/client";
import { IDEA_TAGS } from "./data";
import { sanitizeName, sanitizeText } from "./sanitize";
import { hasRequiredVerifications } from "./tiers";
import type {
  LookingFor,
  MeetPreference,
  MyProfile,
  Person,
  PersonWork,
  TravelRange,
  Verification,
} from "./types";
import { LOOKING_FOR_OPTIONS } from "./types";

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

function publicPhoto(photo: string): string {
  if (!photo) return "";
  if (photo.startsWith("https://") && photo.length <= 2_000 && /^https:\/\/\S+$/i.test(photo)) {
    return photo;
  }
  if (/^data:image\/(jpeg|jpg|png|webp);base64,[a-z0-9+/=\r\n]+$/i.test(photo)) return photo;
  return "";
}

function publicHttps(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return undefined;
    return parsed.toString();
  } catch {
    return undefined;
  }
}

/**
 * What other members are allowed to see.
 * Email, phone, passwordHash, OAuth ids, and verification values stay off this object.
 * `verified` is enough for the standing badge.
 */
export function memberToPerson(m: Member): Person {
  const vers = safeJson<Verification[]>(m.verificationsJson, []);
  const work = safeJson<PersonWork[]>(
    "workJson" in m ? String((m as { workJson?: string }).workJson || "[]") : "[]",
    []
  );
  return {
    id: m.id,
    name: m.name,
    jobTitle: m.jobTitle,
    bio: sanitizeText(m.bio || "", 800),
    photoUrl: publicPhoto(m.photo),
    city: {
      name: m.cityName,
      country: m.cityCountry,
      lat: m.cityLat,
      lng: m.cityLng,
    },
    travel: (m.travel as TravelRange) || "worldwide",
    lookingFor: safeJson<LookingFor[]>(m.lookingForJson, []),
    ideaTags: safeJson<string[]>(m.ideaTagsJson, []),
    verifications: [],
    verified: hasRequiredVerifications(vers),
    work: work.map((item) => ({
      title: sanitizeText(item.title || "", 120),
      kind: item.kind,
      description: sanitizeText(item.description || "", 400),
      url: publicHttps(item.url),
    })),
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
    name: sanitizeName(profile.name || "Member") || "Member",
    jobTitle: sanitizeText(profile.jobTitle || "", 120),
    bio: sanitizeText(profile.bio || "", 800),
    photo: profile.photo || "",
    cityName: sanitizeText(profile.city.name, 80),
    cityCountry: sanitizeText(profile.city.country, 80),
    cityLat: profile.city.lat,
    cityLng: profile.city.lng,
    travel: profile.travel,
    meetPreference: profile.meetPreference || "open",
    lookingForJson: JSON.stringify(
      (profile.lookingFor || [])
        .filter((tag) => (LOOKING_FOR_OPTIONS as readonly string[]).includes(tag))
        .slice(0, LOOKING_FOR_OPTIONS.length)
    ),
    ideaTagsJson: JSON.stringify(
      (profile.ideaTags || [])
        .filter((tag) => (IDEA_TAGS as readonly string[]).includes(tag))
        .slice(0, 12)
    ),
    workJson: JSON.stringify(
      (profile.work || []).slice(0, 12).map((item) => ({
        title: sanitizeText(item.title || "", 120),
        kind: item.kind,
        description: sanitizeText(item.description || "", 400),
        url: publicHttps(item.url) || "",
      }))
    ),
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
