import { distanceKm, LOCAL_RADIUS_KM } from "./match";
import { getPublishedEvents, type InterlinkEvent } from "./events";
import {
  eventCity,
  isOnlineEvent,
  matchFieldsFor,
  type EventMatchFields,
} from "./eventSignals";
import {
  expandTopicTokens,
  inferLookingFor,
  inferRoles,
  relatedTopics,
  tokenize,
  topicAliasesHit,
} from "./eventTaxonomy";
import type { LookingFor } from "./types";
import type { EventRsvp } from "./eventStore";

export type EventInterestStatus = "going" | "saved" | "passed";

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
  city?: { name: string; country: string; lat: number; lng: number };
}

export interface MatchReason {
  kind: "interest" | "intent" | "role" | "bio" | "place" | "feedback";
  label: string;
  weight: number;
}

export interface EventMatchResult {
  event: InterlinkEvent;
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

const STRONG_THRESHOLD = 38;
const SPARSE_THRESHOLD = 26;

const GENERIC_INTENTS = new Set<LookingFor>(["Networking", "Partnership"]);
/** Roles that piggy-back on common titles ("Product Designer", "Restaurant Owner"). */
const GENERIC_ROLES = new Set(["product", "founder"]);

const INTENT_PHRASE =
  /(?:looking for|seeking|want(?:s)?(?: to (?:meet|find|raise|hire|join))?|need(?:s)?|hiring|into|building|raising|open to|trying to|here for)\s+(.{3,48}?)(?:[.!?;,]|$)/gi;

export interface MemberSignals {
  interests: string[];
  roles: string[];
  lookingFor: LookingFor[];
  bioIntents: LookingFor[];
  phrases: string[];
  tokens: Map<string, number>;
  sparse: boolean;
  blob: string;
}

export interface EventSignals extends EventMatchFields {
  tokens: Map<string, number>;
  blob: string;
}

function addTf(map: Map<string, number>, token: string, weight = 1) {
  const key = token.toLowerCase();
  if (!key) return;
  map.set(key, (map.get(key) || 0) + weight);
}

function bagFrom(text: string, weight = 1): Map<string, number> {
  const map = new Map<string, number>();
  for (const t of tokenize(text)) addTf(map, t, weight);
  return map;
}

function mergeBags(into: Map<string, number>, from: Map<string, number>) {
  for (const [k, v] of from) addTf(into, k, v);
}

function extractPhrases(bio: string): string[] {
  if (!bio.trim()) return [];
  const out: string[] = [];
  const re = new RegExp(INTENT_PHRASE.source, INTENT_PHRASE.flags);
  let m: RegExpExecArray | null;
  while ((m = re.exec(bio))) {
    const phrase = (m[1] || "").trim().replace(/\s+/g, " ");
    if (phrase.length >= 3) out.push(phrase);
  }
  return out;
}

export function extractMemberSignals(me: MemberMatchInput): MemberSignals {
  const ideaTags = (me.ideaTags || []).map((t) => t.trim()).filter(Boolean);
  const lookingFor = me.lookingFor || [];
  const bio = me.bio || "";
  const job = me.jobTitle || "";
  const workText = (me.work || [])
    .map((w) => [w.title, w.description].filter(Boolean).join(" "))
    .join(" ");

  const phrases = extractPhrases(bio);
  const phraseText = phrases.join(" ");
  const blob = [job, ideaTags.join(" "), lookingFor.join(" "), bio, workText].join(" ");

  const tokens = bagFrom(job, 2.2);
  mergeBags(tokens, bagFrom(ideaTags.join(" "), 2.4));
  mergeBags(tokens, bagFrom(lookingFor.join(" "), 2));
  mergeBags(tokens, bagFrom(bio, 1.4));
  mergeBags(tokens, bagFrom(workText, 1.1));
  mergeBags(tokens, bagFrom(phraseText, 1.8));
  for (const tag of ideaTags) {
    for (const alias of expandTopicTokens(tag)) addTf(tokens, alias, 1.3);
  }

  const roles = [
    ...new Set([...inferRoles(job), ...inferRoles(bio), ...inferRoles(workText)]),
  ];
  const bioIntents = [
    ...new Set([...inferLookingFor(bio), ...inferLookingFor(phraseText), ...inferLookingFor(job)]),
  ];

  const sparse = ideaTags.length === 0 && bio.trim().length < 28;

  return {
    interests: ideaTags,
    roles,
    lookingFor,
    bioIntents,
    phrases,
    tokens,
    sparse,
    blob,
  };
}

export function extractEventSignals(event: InterlinkEvent): EventSignals {
  const fields = matchFieldsFor(event);
  const blob = [
    event.name,
    event.shortDescription,
    event.description,
    fields.topics.join(" "),
    fields.audience.join(" "),
    fields.roles.join(" "),
    fields.hostRole,
    fields.keywords.join(" "),
    event.organizer,
    ...(event.speakers || []),
    ...(event.companies || []),
  ].join(" ");

  const tokens = bagFrom(event.name, 2.6);
  mergeBags(tokens, bagFrom(`${event.shortDescription} ${event.description}`, 1.3));
  mergeBags(tokens, bagFrom(fields.topics.join(" "), 2.2));
  mergeBags(tokens, bagFrom(fields.audience.join(" "), 1.8));
  mergeBags(tokens, bagFrom(fields.hostRole, 1.4));
  mergeBags(tokens, bagFrom(fields.keywords.join(" "), 1.6));
  for (const tag of fields.topics) {
    for (const alias of expandTopicTokens(tag)) addTf(tokens, alias, 1.2);
  }

  return {
    ...fields,
    tokens,
    blob,
  };
}

function cosine(a: Map<string, number>, b: Map<string, number>, idf: Map<string, number>): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const keys = new Set([...a.keys(), ...b.keys()]);
  for (const k of keys) {
    const w = idf.get(k) ?? 1;
    const av = (a.get(k) || 0) * w;
    const bv = (b.get(k) || 0) * w;
    dot += av * bv;
    na += av * av;
    nb += bv * bv;
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export function buildIdf(events: InterlinkEvent[]): Map<string, number> {
  const df = new Map<string, number>();
  for (const event of events) {
    const seen = new Set(extractEventSignals(event).tokens.keys());
    for (const t of seen) df.set(t, (df.get(t) || 0) + 1);
  }
  const n = Math.max(events.length, 1);
  const idf = new Map<string, number>();
  for (const [t, c] of df) {
    idf.set(t, Math.log((n + 1) / (c + 0.5)));
  }
  return idf;
}

function topicScore(
  member: MemberSignals,
  fields: EventMatchFields
): { score: number; overlap: string[] } {
  if (!member.interests.length) {
    const hits: string[] = [];
    for (const topic of fields.topics) {
      const aliases = expandTopicTokens(topic);
      if (aliases.some((a) => (member.tokens.get(a) || 0) > 0)) {
        hits.push(topic);
      }
    }
    return { score: hits.length ? Math.min(0.55, 0.22 * hits.length) : 0, overlap: hits };
  }

  const overlap: string[] = [];
  let raw = 0;
  const seen = new Set<string>();

  for (const interest of member.interests) {
    if (fields.topics.includes(interest) && !seen.has(interest)) {
      seen.add(interest);
      overlap.push(interest);
      raw += 1;
      continue;
    }
    const related = relatedTopics(interest);
    const relatedHit = fields.topics.find((t) => related.includes(t));
    if (relatedHit && !seen.has(relatedHit)) {
      seen.add(relatedHit);
      raw += 0.34;
      continue;
    }
    const soft = fields.topics.find((t) => topicAliasesHit(interest, t));
    if (soft && !seen.has(soft)) {
      seen.add(soft);
      overlap.push(soft);
      raw += 0.4;
    }
  }

  return {
    score: Math.min(1, raw / Math.max(1, Math.min(member.interests.length, 3))),
    overlap,
  };
}

function intentScore(
  member: MemberSignals,
  event: InterlinkEvent,
  fields: EventMatchFields
): { score: number; overlap: LookingFor[] } {
  const mine = [...new Set([...member.lookingFor, ...member.bioIntents])];
  if (!mine.length) return { score: 0, overlap: [] };

  const overlap = fields.audience.filter((a) => mine.includes(a));
  const specific = overlap.filter((a) => !GENERIC_INTENTS.has(a));
  const generic = overlap.filter((a) => GENERIC_INTENTS.has(a));
  let score =
    (specific.length * 1 + generic.length * 0.35) / Math.max(fields.audience.length, 1);

  const phraseHay = `${member.phrases.join(" ")} ${member.blob}`.toLowerCase();
  const purposeHay = `${event.name} ${event.description} ${fields.keywords.join(" ")}`.toLowerCase();
  let phraseHits = 0;
  for (const phrase of member.phrases) {
    const bits = tokenize(phrase);
    if (bits.filter((b) => b.length > 3).some((b) => purposeHay.includes(b))) phraseHits += 1;
  }
  if (phraseHay.includes("founder intro") && purposeHay.includes("founder")) phraseHits += 1;
  if (phraseHay.includes("design career") && /design|brand|cmo/.test(purposeHay)) phraseHits += 1;
  if (phraseHits) score = Math.min(1, score + 0.18 * Math.min(phraseHits, 2));

  return { score: Math.min(1, score), overlap };
}

function roleOverlapFor(member: MemberSignals, fields: EventMatchFields): string[] {
  const overlap = fields.roles.filter((r) => member.roles.includes(r));
  if (!member.sparse) return overlap;
  const specific = overlap.filter((r) => !GENERIC_ROLES.has(r));
  if (specific.length) return specific;
  const memberOnlyGeneric = member.roles.every((r) => GENERIC_ROLES.has(r));
  return memberOnlyGeneric ? overlap : [];
}

function roleScore(
  member: MemberSignals,
  fields: EventMatchFields
): { score: number; overlap: string[] } {
  const overlap = roleOverlapFor(member, fields);
  if (overlap.length) {
    return { score: Math.min(1, 0.55 + overlap.length * 0.22), overlap };
  }
  const job = (member.blob || "").toLowerCase();
  const soft = roleOverlapFor(member, {
    ...fields,
    roles: fields.roles.filter((r) => job.includes(r)),
  });
  if (soft.length) return { score: 0.36, overlap: soft };
  return { score: 0, overlap: [] };
}

function similarEvents(a: InterlinkEvent, b: InterlinkEvent): boolean {
  if (a.id === b.id) return false;
  const fa = matchFieldsFor(a);
  const fb = matchFieldsFor(b);
  const shared = fa.topics.filter((t) => fb.topics.includes(t));
  return (
    shared.length >= 2 ||
    (shared.length === 1 && fa.audience.some((x) => fb.audience.includes(x))) ||
    (a.industry === b.industry && shared.length >= 1)
  );
}

function feedbackAdjust(
  event: InterlinkEvent,
  catalog: InterlinkEvent[],
  interests: EventInterest[]
): { delta: number; exclude: boolean; reason?: MatchReason } {
  const mine = interests.find((i) => i.eventId === event.id);
  if (mine?.status === "passed") return { delta: 0, exclude: true };
  if (mine?.status === "going") {
    return {
      delta: 8,
      exclude: false,
      reason: { kind: "feedback", label: "You're going", weight: 8 },
    };
  }
  if (mine?.status === "saved") {
    return {
      delta: 5,
      exclude: false,
      reason: { kind: "feedback", label: "Saved", weight: 5 },
    };
  }

  let delta = 0;
  let reason: MatchReason | undefined;
  for (const row of interests) {
    const other = catalog.find((e) => e.id === row.eventId);
    if (!other || !similarEvents(event, other)) continue;
    if (row.status === "passed") delta -= 7;
    if (row.status === "going" || row.status === "saved") {
      delta += 6;
      reason = {
        kind: "feedback",
        label: row.status === "going" ? "Like an event you're going to" : "Like an event you saved",
        weight: 6,
      };
    }
  }
  return { delta, exclude: false, reason };
}

function reasonsFor(opts: {
  topicOverlap: string[];
  intentOverlap: LookingFor[];
  roleOverlap: string[];
  phrases: string[];
  isLocal: boolean;
  cityName?: string;
  jobTitle?: string;
  extra?: MatchReason[];
}): MatchReason[] {
  const reasons: MatchReason[] = [];
  if (opts.topicOverlap[0]) {
    reasons.push({
      kind: "interest",
      label: opts.topicOverlap[0],
      weight: 3,
    });
  }
  const intent =
    opts.intentOverlap.find((item) => !GENERIC_INTENTS.has(item)) || opts.intentOverlap[0];
  if (intent && !GENERIC_INTENTS.has(intent)) {
    reasons.push({
      kind: "intent",
      label: `Looking for ${intent}`,
      weight: 3,
    });
  } else if (intent && !opts.topicOverlap[0]) {
    reasons.push({
      kind: "intent",
      label: `Looking for ${intent}`,
      weight: 2,
    });
  }
  if (opts.roleOverlap[0] && opts.jobTitle) {
    reasons.push({
      kind: "role",
      label: opts.jobTitle.trim(),
      weight: 2,
    });
  } else if (opts.roleOverlap[0]) {
    reasons.push({
      kind: "role",
      label: `Fits ${opts.roleOverlap[0]}`,
      weight: 2,
    });
  }
  const phrase = opts.phrases.find((p) => p.length >= 4 && p.length <= 42);
  if (phrase) {
    reasons.push({
      kind: "bio",
      label: phrase.charAt(0).toUpperCase() + phrase.slice(1),
      weight: 2,
    });
  }
  if (opts.isLocal && opts.cityName) {
    reasons.push({
      kind: "place",
      label: `Near you in ${opts.cityName}`,
      weight: 1,
    });
  }
  if (opts.extra) reasons.push(...opts.extra);
  return reasons.sort((a, b) => b.weight - a.weight).slice(0, 3);
}

export function scoreEvent(
  me: MemberMatchInput,
  event: InterlinkEvent,
  opts?: {
    interests?: EventInterest[];
    catalog?: InterlinkEvent[];
    idf?: Map<string, number>;
  }
): EventMatchResult {
  const member = extractMemberSignals(me);
  const ev = extractEventSignals(event);
  const catalog = opts?.catalog || getPublishedEvents();
  const idf = opts?.idf || buildIdf(catalog);

  const topics = topicScore(member, ev);
  const intent = intentScore(member, event, ev);
  const roles = roleScore(member, ev);
  const text = cosine(member.tokens, ev.tokens, idf);

  const city = eventCity(event);
  const distance = me.city && !isOnlineEvent(event) ? distanceKm(me.city, city) : 9999;
  const isLocal =
    !isOnlineEvent(event) && Number.isFinite(distance) && distance <= LOCAL_RADIUS_KM;
  const sameCountry = !!me.city && me.city.country === event.country;
  const geo = isOnlineEvent(event) ? 0.55 : isLocal ? 1 : sameCountry ? 0.4 : 0.08;

  const specificIntent = intent.overlap.some(
    (a) => !GENERIC_INTENTS.has(a) && (a !== "Clients" || topics.overlap.length > 0)
  );
  const roleWeight = topics.score >= 0.2 || specificIntent || member.sparse ? (member.sparse ? 26 : 18) : 7;

  let score =
    topics.score * 34 +
    intent.score * 28 +
    roles.score * roleWeight +
    text * 14 +
    geo * 8;

  const fb = feedbackAdjust(event, catalog, opts?.interests || []);
  if (fb.exclude) {
    return {
      event,
      score: 0,
      reasons: [],
      topicOverlap: topics.overlap,
      intentOverlap: intent.overlap,
      roleOverlap: roles.overlap,
      textScore: text,
      distanceKm: distance,
      isLocal,
      sparse: member.sparse,
    };
  }
  score += fb.delta;

  const hasCore =
    topics.overlap.length > 0 ||
    specificIntent ||
    (member.sparse && roles.score >= 0.36);
  if (!hasCore) score *= 0.42;
  if (member.sparse && roles.overlap.length > 0) {
    score = Math.max(score, SPARSE_THRESHOLD + 6);
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const reasons = reasonsFor({
    topicOverlap: topics.overlap,
    intentOverlap: intent.overlap,
    roleOverlap: roles.overlap,
    phrases: member.phrases,
    isLocal,
    cityName: me.city?.name,
    jobTitle: me.jobTitle,
    extra: fb.reason ? [fb.reason] : [],
  });

  return {
    event,
    score,
    reasons,
    topicOverlap: topics.overlap,
    intentOverlap: intent.overlap,
    roleOverlap: roles.overlap,
    textScore: text,
    distanceKm: distance,
    isLocal,
    sparse: member.sparse,
  };
}

export function isStrongEventMatch(m: EventMatchResult): boolean {
  const floor = m.sparse ? SPARSE_THRESHOLD : STRONG_THRESHOLD;
  if (m.score < floor) return false;
  if (m.sparse) {
    return m.topicOverlap.length > 0 || m.roleOverlap.length > 0 || m.intentOverlap.length > 0;
  }
  if (m.topicOverlap.length > 0) return true;
  const specific = m.intentOverlap.some(
    (a) => !GENERIC_INTENTS.has(a) && a !== "Clients"
  );
  return specific && m.textScore >= 0.24;
}

/**
 * Rank published events for a member. Precision-first: weak matches are dropped,
 * not padded to fill a grid.
 */
export function rankEvents(
  me: MemberMatchInput,
  events: InterlinkEvent[] = getPublishedEvents(),
  interests: EventInterest[] = []
): EventMatchResult[] {
  const idf = buildIdf(events);
  return events
    .map((event) => scoreEvent(me, event, { interests, catalog: events, idf }))
    .filter((m) => m.score > 0 && isStrongEventMatch(m))
    .sort((a, b) => {
      const core = (m: EventMatchResult) =>
        (m.topicOverlap.length ? 4 : 0) +
        (m.intentOverlap.length ? 3 : 0) +
        (m.roleOverlap.length ? 2 : 0) +
        (m.isLocal ? 1 : 0);
      return core(b) - core(a) || b.score - a.score || a.distanceKm - b.distanceKm;
    });
}

export function interestsFromRsvps(rsvps: Record<string, EventRsvp>): EventInterest[] {
  const out: EventInterest[] = [];
  for (const [eventId, status] of Object.entries(rsvps)) {
    if (status === "going") out.push({ eventId, status: "going" });
    else if (status === "interested") out.push({ eventId, status: "saved" });
    else if (status === "passed") out.push({ eventId, status: "passed" });
  }
  return out;
}

export function formatMatchReasons(reasons: MatchReason[], limit = 2): string {
  return reasons
    .slice(0, limit)
    .map((r) => r.label)
    .join(" · ");
}
