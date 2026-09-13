import type { City, LookingFor } from "./types";

/** Hosted Interlink table — a dinner, salon, or night with a topic and audience. */
export type TableKind = "dinner" | "salon" | "night";

export type EventInterestStatus = "going" | "saved" | "passed";

export interface MeetEvent {
  id: string;
  title: string;
  description: string;
  /** Aligned with member ideaTags where possible. */
  topics: string[];
  /** Who the table is for — same vocabulary as profile lookingFor. */
  audience: LookingFor[];
  /** Role families the host is seating (founder, designer, engineer, …). */
  roles: string[];
  hostName: string;
  hostRole: string;
  city: City;
  venueName: string;
  kind: TableKind;
  startsAt: string;
  seats: number;
  /** Extra matching tokens that are not shown as chips. */
  keywords?: string[];
}

export interface EventInterest {
  eventId: string;
  status: EventInterestStatus;
}

/** Profile fields the matcher actually reads. */
export interface MemberMatchInput {
  jobTitle?: string;
  ideaTags?: string[];
  lookingFor?: LookingFor[];
  bio?: string;
  work?: { title?: string; description?: string }[];
  city?: City;
}

export interface MatchReason {
  kind: "interest" | "intent" | "role" | "bio" | "place" | "feedback";
  label: string;
  weight: number;
}

export interface EventMatchResult {
  event: MeetEvent;
  score: number;
  reasons: MatchReason[];
  topicOverlap: string[];
  intentOverlap: LookingFor[];
  roleOverlap: string[];
  textScore: number;
  distanceKm: number;
  isLocal: boolean;
  sparse: boolean;
}
