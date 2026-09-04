"use client";

import { formatPhoneDisplay, isValidPhone, maskPhone } from "./phone";
import { summarizeReputation } from "./reputation";
import type { FoodSuggestion } from "./foodAi";
import { DEMO_PROFILE } from "./demoAccount";
import { demoEntryEnabled, demoProfilesEnabled } from "./demoFlag";
import { DEMO_PEOPLE } from "./demoPeople";
import { findPerson } from "./directory";
import { trialEndsAt } from "./plans";
import {
  BOOKING_FEE_PER_PERSON_USD,
  bookingHeadcount,
  bookingTotalUsd,
  formatUsd,
} from "./pricing";
import type {
  ChatMessage,
  Connection,
  GroupChat,
  MeetingRating,
  Meetup,
  MyProfile,
  PremierInterval,
} from "./types";

const PROFILE_KEY = "meetpoint.profile";
const CONNECTIONS_KEY = "meetpoint.connections";
const CHATS_KEY = "meetpoint.chats";
const RATINGS_KEY = "meetpoint.ratings";
const BLOCKS_KEY = "meetpoint.blocked";

/** The retired "Enter demo" account signed itself with this LinkedIn value. */
const DEMO_PROFILE_MARKER = "linkedin.com/in/conclave-demo";

function isRetiredDemoProfile(p: MyProfile): boolean {
  return (p.verifications || []).some((v) =>
    String(v.value || "").includes(DEMO_PROFILE_MARKER)
  );
}

export function loadProfile(): MyProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as MyProfile;

    // With demo mode off, a browser that once used it shouldn't keep that member alive.
    if (!demoEntryEnabled() && isRetiredDemoProfile(p)) {
      clearProfile();
      return null;
    }

    // Discover only uses For you / Nearby — legacy split prefs map to For you
    if (
      !p.meetPreference ||
      p.meetPreference === "same-business" ||
      p.meetPreference === "can-help" ||
      p.meetPreference === "same-profession"
    ) {
      p.meetPreference = "open";
    }
    if (!p.lookingFor) p.lookingFor = [];
    if (!p.verifications) p.verifications = [];

    // Migrate legacy Pro → Premier
    if (!p.premierPlan && p.proPlan) {
      p.premierPlan = p.proPlan;
      delete p.proPlan;
      localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    }

    // Auto-verify existing members so they aren't locked out of the room.
    if (p.verifications.length === 0) {
      if (p.linkedInId) {
        p.verifications = [
          {
            method: "linkedin",
            value: `linkedin:${p.linkedInId}`,
            verifiedAt: new Date().toISOString(),
          },
        ];
      } else if (p.name && p.photo) {
        p.verifications = [
          {
            method: "portfolio",
            value: "verified:member",
            verifiedAt: new Date().toISOString(),
          },
        ];
      }
      if (p.verifications.length) {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
      }
    }

    return p;
  } catch {
    return null;
  }
}

export function saveProfile(profile: MyProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  window.dispatchEvent(new CustomEvent("meetpoint:profile-changed"));
  // Persist to SQLite so other devices / members can see you
  void import("./apiClient").then(({ syncProfileToServer }) => syncProfileToServer(profile));
}

/** Install the sample member and skip onboarding — demo mode only. */
export function enterAsDemo(): MyProfile {
  const profile: MyProfile = {
    ...DEMO_PROFILE,
    verifications: DEMO_PROFILE.verifications.map((v) => ({
      ...v,
      verifiedAt: new Date().toISOString(),
    })),
    premierPlan: {
      active: true,
      startedAt: new Date().toISOString(),
      interval: "year",
      trialEndsAt: trialEndsAt(new Date()),
    },
  };
  saveProfile(profile);
  return profile;
}

export function activatePremierPlan(interval: PremierInterval = "month"): MyProfile | null {
  const profile = loadProfile();
  if (!profile) return null;
  const startedAt = new Date().toISOString();
  const next: MyProfile = {
    ...profile,
    premierPlan: {
      active: true,
      startedAt,
      interval,
      ...(interval === "year" ? { trialEndsAt: trialEndsAt(new Date()) } : {}),
    },
  };
  delete next.proPlan;
  saveProfile(next);
  return next;
}

/** Switch monthly ↔ yearly while Premier is active (no second free trial). */
export function switchPremierInterval(interval: PremierInterval): MyProfile | null {
  const profile = loadProfile();
  if (!profile?.premierPlan?.active) return activatePremierPlan(interval);

  const current = profile.premierPlan.interval || "month";
  if (current === interval) return profile;

  const next: MyProfile = {
    ...profile,
    premierPlan: {
      ...profile.premierPlan,
      active: true,
      interval,
      // Keep an existing trial only if staying on yearly; monthly clears it.
      trialEndsAt:
        interval === "year"
          ? profile.premierPlan.trialEndsAt &&
            new Date(profile.premierPlan.trialEndsAt).getTime() > Date.now()
            ? profile.premierPlan.trialEndsAt
            : undefined
          : undefined,
    },
  };
  delete next.proPlan;
  saveProfile(next);
  return next;
}

export function cancelPremierPlan(): MyProfile | null {
  const profile = loadProfile();
  if (!profile) return null;
  const next: MyProfile = {
    ...profile,
    premierPlan: profile.premierPlan
      ? { ...profile.premierPlan, active: false }
      : undefined,
  };
  delete next.proPlan;
  saveProfile(next);
  return next;
}

export function clearProfile(): void {
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(CONNECTIONS_KEY);
  localStorage.removeItem(CHATS_KEY);
  localStorage.removeItem(RATINGS_KEY);
}

export function loadConnections(): Connection[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CONNECTIONS_KEY);
    return raw ? (JSON.parse(raw) as Connection[]) : [];
  } catch {
    return [];
  }
}

function saveConnections(connections: Connection[]): void {
  localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(connections));
}

export function getConnection(peerId: string): Connection | undefined {
  return loadConnections().find((c) => c.peerId === peerId);
}

/**
 * You send an introduction — it stays "requested" until they accept.
 * In demo mode the sample members accept after a short delay.
 */
export function requestConnection(peerId: string): Connection[] {
  const connections = loadConnections();
  if (!connections.some((c) => c.peerId === peerId)) {
    connections.push({ peerId, status: "requested", direction: "out" });
    saveConnections(connections);
    if (demoProfilesEnabled() && DEMO_PEOPLE.some((p) => p.id === peerId)) {
      scheduleDemoAccept(peerId);
    }
    void import("./apiClient").then(async ({ requestServerConnection }) => {
      const remote = await requestServerConnection(peerId);
      if (remote) {
        saveConnections(remote);
        window.dispatchEvent(new CustomEvent("meetpoint:connections-changed"));
      }
    });
  }
  return connections;
}

function scheduleDemoAccept(peerId: string) {
  const delay = 4000 + Math.floor(Math.random() * 4000);
  setTimeout(() => {
    const before = getConnection(peerId);
    if (!before || before.status !== "requested" || before.direction === "in") return;
    acceptConnection(peerId);
    const first = DEMO_PEOPLE.find((p) => p.id === peerId)?.name.split(" ")[0] || "They";
    window.dispatchEvent(
      new CustomEvent("meetpoint:toast", {
        detail: {
          message: `${first} accepted your introduction. Message them in Circle.`,
          peerId,
        },
      })
    );
    void import("./notify").then(({ pushAppNotification }) =>
      pushAppNotification(
        "Introduction accepted",
        `${first} accepted. Open Circle to message them.`,
        { url: "/circle", tag: "conclave-intro" }
      )
    );
  }, delay);
}

/** Seed one inbound intro so Circle has Accept / Decline — demo mode only. */
export function ensureSampleInboundRequest(): void {
  if (typeof window === "undefined") return;
  if (!demoProfilesEnabled()) return;
  const key = "meetpoint.inbound.seeded";
  try {
    if (sessionStorage.getItem(key) === "1") return;
  } catch {
    /* continue */
  }

  const existing = loadConnections();
  if (existing.some((c) => c.direction === "in" && c.status === "requested")) {
    try {
      sessionStorage.setItem(key, "1");
    } catch {
      /* ignore */
    }
    return;
  }

  const taken = new Set(existing.map((c) => c.peerId));
  const candidate = DEMO_PEOPLE.find((p) => !taken.has(p.id));
  if (!candidate) return;

  const delay = 6000 + Math.floor(Math.random() * 5000);
  setTimeout(() => {
    const list = loadConnections();
    if (list.some((c) => c.peerId === candidate.id)) return;
    list.push({ peerId: candidate.id, status: "requested", direction: "in" });
    saveConnections(list);
    window.dispatchEvent(new CustomEvent("meetpoint:connections-changed"));
    const first = candidate.name.split(" ")[0];
    window.dispatchEvent(
      new CustomEvent("meetpoint:toast", {
        detail: {
          message: `${first} wants an introduction. Open Circle to accept.`,
          peerId: candidate.id,
        },
      })
    );
  }, delay);

  try {
    sessionStorage.setItem(key, "1");
  } catch {
    /* ignore */
  }
}

export function loadBlockedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BLOCKS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveBlockedIds(ids: string[]): void {
  localStorage.setItem(BLOCKS_KEY, JSON.stringify([...new Set(ids)]));
  window.dispatchEvent(new CustomEvent("meetpoint:blocks-changed"));
}

export function isBlocked(peerId: string): boolean {
  return loadBlockedIds().includes(peerId);
}

export function blockPeer(peerId: string): string[] {
  const ids = [...new Set([...loadBlockedIds(), peerId])];
  saveBlockedIds(ids);
  removeConnection(peerId);
  void import("./apiClient").then(async ({ setBlocked }) => {
    const remote = await setBlocked(peerId, "block");
    if (remote) saveBlockedIds(remote);
  });
  return ids;
}

export function unblockPeer(peerId: string): string[] {
  const ids = loadBlockedIds().filter((id) => id !== peerId);
  saveBlockedIds(ids);
  void import("./apiClient").then(async ({ setBlocked }) => {
    const remote = await setBlocked(peerId, "unblock");
    if (remote) saveBlockedIds(remote);
  });
  return ids;
}

export function acceptConnection(peerId: string): Connection[] {
  const connections = loadConnections();
  const conn = connections.find((c) => c.peerId === peerId);
  if (conn && conn.status === "requested") {
    conn.status = "connected";
    saveConnections(connections);
    window.dispatchEvent(new CustomEvent("meetpoint:connections-changed"));
  }
  void import("./apiClient").then(async ({ patchServerConnection }) => {
    const remote = await patchServerConnection(peerId, "accept");
    if (remote) {
      saveConnections(remote);
      window.dispatchEvent(new CustomEvent("meetpoint:connections-changed"));
    }
  });
  return connections;
}

export function declineConnection(peerId: string): Connection[] {
  void import("./apiClient").then(({ patchServerConnection }) =>
    patchServerConnection(peerId, "decline")
  );
  return removeConnection(peerId);
}

export function removeConnection(peerId: string): Connection[] {
  const connections = loadConnections().filter((c) => c.peerId !== peerId);
  saveConnections(connections);
  window.dispatchEvent(new CustomEvent("meetpoint:connections-changed"));
  void import("./apiClient").then(({ patchServerConnection }) =>
    patchServerConnection(peerId, "remove")
  );
  return connections;
}

export function setMeetup(peerId: string, meetup: Meetup): Connection[] {
  const connections = loadConnections();
  const conn = connections.find((c) => c.peerId === peerId);
  if (conn) {
    conn.meetup = meetup;
    saveConnections(connections);
  }
  return connections;
}

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function loadChats(): GroupChat[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CHATS_KEY);
    return raw ? (JSON.parse(raw) as GroupChat[]) : [];
  } catch {
    return [];
  }
}

function saveChats(chats: GroupChat[]): void {
  localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
  window.dispatchEvent(new CustomEvent("meetpoint:chats-changed"));
}

export function getChat(id: string): GroupChat | undefined {
  return loadChats().find((c) => c.id === id);
}

/** Create a private chat with one or more connected peers. */
export function createChat(name: string, memberIds: string[]): GroupChat {
  const now = new Date().toISOString();
  const chat: GroupChat = {
    id: uid(),
    name: name.trim() || "Private chat",
    memberIds: [...new Set(memberIds)],
    messages: [
      {
        id: uid(),
        senderId: "system",
        text: "This private room is open. Speak freely.",
        createdAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
  const chats = [chat, ...loadChats()];
  saveChats(chats);

  // Prefer server chat id when available (multi-device)
  void fetch("/api/chats", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: chat.name, memberIds: chat.memberIds }),
  })
    .then((r) => r.json())
    .then((data: { ok?: boolean; chat?: GroupChat }) => {
      if (!data.ok || !data.chat?.id) return;
      const latest = loadChats();
      const idx = latest.findIndex((c) => c.id === chat.id);
      if (idx < 0) return;
      latest[idx] = {
        ...latest[idx],
        id: data.chat.id,
        createdAt: data.chat.createdAt || latest[idx].createdAt,
        updatedAt: data.chat.updatedAt || latest[idx].updatedAt,
      };
      saveChats(latest);
    })
    .catch(() => undefined);

  return chat;
}

export function sendChatMessage(
  chatId: string,
  text: string,
  attachment?: ChatMessage["attachment"]
): GroupChat | undefined {
  const trimmed = text.trim();
  if (!trimmed && !attachment) return getChat(chatId);

  const chats = loadChats();
  const chat = chats.find((c) => c.id === chatId);
  if (!chat) return undefined;

  const msg: ChatMessage = {
    id: uid(),
    senderId: "me",
    text: trimmed || (attachment?.kind === "image" ? "Photo" : attachment?.name || "File"),
    createdAt: new Date().toISOString(),
    attachment,
  };
  chat.messages.push(msg);
  chat.updatedAt = msg.createdAt;
  saveChats(chats);

  // Best-effort server sync (real multi-device); ignore failures for local-only chats
  if (trimmed) {
    void fetch(`/api/chats/${chatId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: trimmed }),
    }).catch(() => undefined);
  }

  // Demo mode: a sample member replies after a short pause.
  if (demoProfilesEnabled() && chat.memberIds.length > 0 && Math.random() > 0.35) {
    const peerId = chat.memberIds[Math.floor(Math.random() * chat.memberIds.length)];
    if (DEMO_PEOPLE.some((p) => p.id === peerId)) {
      const replies = [
        "Agreed — let's take this further over dinner.",
        "Interesting. I know someone who might help with that.",
        "I'm in. When works for the table?",
        "Same here. Happy to compare notes.",
        "That aligns with what I'm building.",
      ];
      setTimeout(() => {
        const latest = loadChats();
        const c = latest.find((x) => x.id === chatId);
        if (!c) return;
        c.messages.push({
          id: uid(),
          senderId: peerId,
          text: replies[Math.floor(Math.random() * replies.length)],
          createdAt: new Date().toISOString(),
        });
        c.updatedAt = new Date().toISOString();
        saveChats(latest);
      }, 1200 + Math.random() * 1800);
    }
  }

  return chat;
}

export function deleteChat(chatId: string): GroupChat[] {
  const chats = loadChats().filter((c) => c.id !== chatId);
  saveChats(chats);
  return chats;
}

function requiredVoters(chat: GroupChat): string[] {
  return ["me", ...chat.memberIds];
}

export function allAgreed(chat: GroupChat): boolean {
  const proposal = chat.tableProposal;
  if (!proposal || proposal.booked) return false;
  const needed = requiredVoters(chat);
  return needed.every((id) => proposal.agreedBy.includes(id));
}

/** Propose a table from the AI popup — starts the agree → book flow. */
export function proposeTable(chatId: string, suggestion: FoodSuggestion): GroupChat | undefined {
  const chats = loadChats();
  const chat = chats.find((c) => c.id === chatId);
  if (!chat) return undefined;

  const now = new Date().toISOString();
  const r = suggestion.restaurant;
  chat.tableProposal = {
    restaurantId: r.id,
    restaurantName: r.name,
    cuisine: r.cuisine,
    city: r.city,
    country: r.country,
    vibe: r.vibe,
    proposedBy: "me",
    agreedBy: [],
    booked: false,
  };
  chat.messages.push({
    id: uid(),
    senderId: "system",
    text: `Table proposed: ${r.name}. Everyone must agree — then booking charges ${formatUsd(BOOKING_FEE_PER_PERSON_USD)} per person.`,
    createdAt: now,
  });
  chat.updatedAt = now;
  saveChats(chats);
  return chat;
}

/** Current member agrees to the proposed table. */
export function agreeToTable(chatId: string, voterId = "me"): GroupChat | undefined {
  const chats = loadChats();
  const chat = chats.find((c) => c.id === chatId);
  if (!chat?.tableProposal || chat.tableProposal.booked) return chat;

  if (!chat.tableProposal.agreedBy.includes(voterId)) {
    chat.tableProposal.agreedBy = [...chat.tableProposal.agreedBy, voterId];
    chat.updatedAt = new Date().toISOString();
    saveChats(chats);
  }

  // Demo mode: after you agree, the sample members agree one by one.
  if (demoProfilesEnabled() && voterId === "me") {
    chat.memberIds
      .filter((peerId) => DEMO_PEOPLE.some((p) => p.id === peerId))
      .forEach((peerId, i) => {
        setTimeout(() => {
          const latest = loadChats();
          const c = latest.find((x) => x.id === chatId);
          if (!c?.tableProposal || c.tableProposal.booked) return;
          if (c.tableProposal.agreedBy.includes(peerId)) return;
          c.tableProposal.agreedBy = [...c.tableProposal.agreedBy, peerId];
          c.updatedAt = new Date().toISOString();
          saveChats(latest);
        }, 900 + i * 700);
      });
  }

  return chat;
}

/** Book only when agreed + meetup time + phone — charges $5 per person, texts confirmation. */
export function bookTable(
  chatId: string,
  meetupAt: string,
  contactPhone: string,
  paymentMethod: "apple-pay" | "card" = "card"
): GroupChat | undefined {
  const chats = loadChats();
  const chat = chats.find((c) => c.id === chatId);
  if (!chat?.tableProposal || chat.tableProposal.booked) return chat;
  if (!allAgreed(chat)) return chat;
  if (!isValidPhone(contactPhone)) return chat;

  const when = new Date(meetupAt);
  if (!meetupAt || Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
    return chat;
  }

  const now = new Date().toISOString();
  const headcount = bookingHeadcount(chat.memberIds);
  const total = bookingTotalUsd(chat.memberIds);
  const whenLabel = when.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const phone = formatPhoneDisplay(contactPhone);
  const payLabel = paymentMethod === "apple-pay" ? "Apple Pay" : "card";

  // Persist phone on profile so future bookings can text automatically.
  const profile = loadProfile();
  if (profile) {
    const next = {
      ...profile,
      phone: !profile.phone || profile.phone !== phone ? phone : profile.phone,
      meetingsAttended: (profile.meetingsAttended ?? 0) + 1,
    };
    saveProfile(next);
  }

  chat.tableProposal.booked = true;
  chat.tableProposal.bookedBy = "me";
  chat.tableProposal.bookedAt = now;
  chat.tableProposal.meetupAt = when.toISOString();
  chat.tableProposal.contactPhone = phone;
  chat.tableProposal.paymentMethod = paymentMethod;
  chat.tableProposal.chargePerPersonUsd = BOOKING_FEE_PER_PERSON_USD;
  chat.tableProposal.headcount = headcount;
  chat.tableProposal.totalChargedUsd = total;

  const memberNames = [
    profile?.name.split(" ")[0] || "You",
    ...chat.memberIds.map((id) => findPerson(id)?.name.split(" ")[0] || "Member"),
  ];

  chat.messages.push({
    id: uid(),
    senderId: "system",
    text: `Table confirmed at ${chat.tableProposal.restaurantName} · ${whenLabel}. Coming soon.`,
    createdAt: now,
  });
  chat.messages.push({
    id: uid(),
    senderId: "system",
    text: `Paid via ${payLabel} · ${formatUsd(BOOKING_FEE_PER_PERSON_USD)}/person · ${formatUsd(total)} total. Text → ${maskPhone(phone)}. Alerts sent to ${memberNames.join(", ")}.`,
    createdAt: now,
  });
  chat.updatedAt = now;
  saveChats(chats);

  // SMS + device notifications for everyone at this table (async; don't block UI)
  void import("./notify").then(({ notifyTableBooked }) =>
    notifyTableBooked({
      restaurant: chat.tableProposal!.restaurantName,
      whenLabel,
      phone,
      memberNames,
    })
  );

  return chat;
}

export function clearTableProposal(chatId: string): GroupChat | undefined {
  const chats = loadChats();
  const chat = chats.find((c) => c.id === chatId);
  if (!chat) return undefined;
  delete chat.tableProposal;
  chat.updatedAt = new Date().toISOString();
  saveChats(chats);
  return chat;
}

export function loadRatings(): MeetingRating[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RATINGS_KEY);
    return raw ? (JSON.parse(raw) as MeetingRating[]) : [];
  } catch {
    return [];
  }
}

function saveRatings(ratings: MeetingRating[]): void {
  localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings));
  window.dispatchEvent(new CustomEvent("meetpoint:ratings-changed"));
}

export function getRatingForPeer(peerId: string): MeetingRating | undefined {
  return loadRatings().find((r) => r.peerId === peerId);
}

export function saveMeetingRating(
  rating: Omit<MeetingRating, "createdAt">
): MeetingRating[] {
  const ratings = loadRatings().filter((r) => r.peerId !== rating.peerId);
  ratings.push({ ...rating, createdAt: new Date().toISOString() });
  saveRatings(ratings);
  return ratings;
}

export function getPeerReputation(peerId: string) {
  return summarizeReputation(peerId, loadRatings());
}

/** Booked tables count toward Trusted / Connector standing. */
export function getMeetingsAttended(profile?: MyProfile | null): number {
  const p = profile ?? loadProfile();
  const fromProfile = p?.meetingsAttended ?? 0;
  const fromBookings = loadChats().filter((c) => c.tableProposal?.booked).length;
  return Math.max(fromProfile, fromBookings);
}
