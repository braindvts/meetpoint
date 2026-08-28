export type TravelRange = "local" | "country" | "worldwide";

/** Who the member prefers to be introduced to. */
export type MeetPreference =
  | "same-business"
  | "can-help"
  | "same-profession"
  | "open";

/** What the member is looking for in introductions. */
export type LookingFor =
  | "Co-founder"
  | "Investor"
  | "Mentor"
  | "Clients"
  | "Hiring"
  | "Partnership"
  | "Networking";

export const LOOKING_FOR_OPTIONS: LookingFor[] = [
  "Co-founder",
  "Investor",
  "Mentor",
  "Clients",
  "Hiring",
  "Partnership",
  "Networking",
];

export type VerificationMethod =
  | "company-email"
  | "linkedin"
  | "website"
  | "registration"
  | "portfolio";

export const VERIFICATION_OPTIONS: {
  method: VerificationMethod;
  label: string;
  hint: string;
  placeholder: string;
}[] = [
  {
    method: "company-email",
    label: "Company email",
    hint: "A work address — not Gmail or personal mail.",
    placeholder: "you@company.com",
  },
  {
    method: "linkedin",
    label: "LinkedIn profile",
    hint: "Your public LinkedIn URL, or sign in with LinkedIn.",
    placeholder: "https://linkedin.com/in/you",
  },
  {
    method: "website",
    label: "Business website",
    hint: "Your company or product site.",
    placeholder: "https://yourcompany.com",
  },
  {
    method: "registration",
    label: "Business registration",
    hint: "For founders — company number or registry ID.",
    placeholder: "e.g. LLC-123456 or Companies House number",
  },
  {
    method: "portfolio",
    label: "Professional portfolio",
    hint: "Work samples, Behance, GitHub, personal site.",
    placeholder: "https://portfolio.you",
  },
];

export interface Verification {
  method: VerificationMethod;
  /** Email, URL, or registration number. */
  value: string;
  verifiedAt: string;
}

export interface City {
  name: string;
  country: string;
  lat: number;
  lng: number;
}

/** A project, company, app, or piece of work on someone's profile. */
export type WorkKind =
  | "company"
  | "app"
  | "product"
  | "website"
  | "content"
  | "portfolio"
  | "project";

export interface PersonWork {
  title: string;
  kind: WorkKind;
  description: string;
  /** Live link when available. */
  url?: string;
}

export interface Person {
  id: string;
  name: string;
  jobTitle: string;
  ideaTags: string[];
  /** Why they're in the room. */
  lookingFor: LookingFor[];
  bio: string;
  city: City;
  travel: TravelRange;
  photoUrl: string;
  /** How they verified — at least one. */
  verifications: VerificationMethod[];
  /** Public LinkedIn profile. */
  linkedInUrl?: string;
  /** Main company / personal site. */
  websiteUrl?: string;
  /** Portfolio, GitHub, Behance, etc. */
  portfolioUrl?: string;
  /** Companies, apps, products, and projects they've built. */
  work?: PersonWork[];
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  priceLevel: 1 | 2 | 3;
  vibe: string;
  /** Optional dining photo; otherwise a cuisine-matched image is used. */
  photoUrl?: string;
}

export type MeetMode = "i-fly" | "they-fly" | "midpoint";

export interface Meetup {
  mode: MeetMode;
  restaurantId: string;
  date: string;
  note?: string;
}

export type ConnectionStatus = "requested" | "connected";

/** out = you introduced them; in = they introduced you (awaiting your accept). */
export type ConnectionDirection = "out" | "in";

export interface Connection {
  peerId: string;
  status: ConnectionStatus;
  /** Defaults to "out" for legacy saved connections. */
  direction?: ConnectionDirection;
  meetup?: Meetup;
}

export type PremierInterval = "month" | "year";

export interface MyProfile {
  name: string;
  jobTitle: string;
  ideaTags: string[];
  /** Required — what introductions they're seeking. */
  lookingFor: LookingFor[];
  bio: string;
  city: City;
  travel: TravelRange;
  /** Who they want to meet — preferred matches still rank first. */
  meetPreference: MeetPreference;
  /** Profile photo — LinkedIn URL or uploaded image data URL. */
  photo: string;
  /** Mobile for reservation SMS. Optional on profile; required at booking. */
  phone?: string;
  /** Required — at least one professional credential. */
  verifications: Verification[];
  /** Set when the user signed in with LinkedIn. */
  linkedInId?: string;
  /** Successful table bookings / meetings attended. */
  meetingsAttended?: number;
  /** Projects, companies, and work shown on your public card. */
  work?: PersonWork[];
  /** Elite invite or earned flag. */
  elite?: boolean;
  /** Conclave Premier — monthly $20 or yearly $100 (3-day trial on yearly). */
  premierPlan?: {
    active: boolean;
    startedAt: string;
    interval?: PremierInterval;
    /** ISO — yearly free trial ends; then $100/yr. */
    trialEndsAt?: string;
  };
  /** @deprecated migrated to premierPlan */
  proPlan?: {
    active: boolean;
    startedAt: string;
  };
}

export interface ChatAttachment {
  kind: "image" | "file";
  /** data URL for demo storage, or remote URL later */
  url: string;
  name: string;
  /** MIME type when known */
  mime?: string;
}

export interface ChatMessage {
  id: string;
  /** "me" for the signed-in member, or a peer Person.id */
  senderId: string;
  text: string;
  createdAt: string;
  attachment?: ChatAttachment;
}

export interface GroupChat {
  id: string;
  name: string;
  /** Connected peer IDs in this private chat (current user is always included). */
  memberIds: string[];
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  /** Active table proposal — everyone must agree, then someone books. */
  tableProposal?: TableProposal;
}

export interface TableProposal {
  restaurantId: string;
  restaurantName: string;
  cuisine: string;
  city: string;
  country: string;
  vibe: string;
  proposedBy: string;
  /** Member ids who agreed, including "me". */
  agreedBy: string[];
  booked: boolean;
  bookedBy?: string;
  bookedAt?: string;
  /** Scheduled meetup datetime (ISO). Required before payment. */
  meetupAt?: string;
  /** Booker's phone for reservation SMS. */
  contactPhone?: string;
  /** How the booker paid (demo). */
  paymentMethod?: "apple-pay" | "card";
  /** USD charged to each member at booking ($5). */
  chargePerPersonUsd?: number;
  /** Number of people charged (you + peers). */
  headcount?: number;
  /** Total Conclave fee collected for this table. */
  totalChargedUsd?: number;
}

/** Post-meetup rating — both sides answer the same four questions. */
export interface MeetingRating {
  peerId: string;
  showedUp: boolean;
  professional: boolean;
  valuable: boolean;
  wouldMeetAgain: boolean;
  createdAt: string;
}

export type ReputationStatus = "standing" | "caution" | "hidden";

export interface ReputationSummary {
  peerId: string;
  ratingCount: number;
  showedUpRate: number;
  professionalRate: number;
  valuableRate: number;
  wouldMeetAgainRate: number;
  /** 0–100 composite standing. */
  score: number;
  status: ReputationStatus;
}
