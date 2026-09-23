"use client";

import { formatPhoneDisplay, isValidPhone, maskPhone } from "./phone";
import { summarizeReputation } from "./reputation";
import type { FoodSuggestion } from "./foodAi";
import { mergeServerConnections } from "./connectionMerge";
import { DEMO_PROFILE } from "./demoAccount";
import { demoEntryEnabled, demoProfilesEnabled } from "./demoFlag";
import { DEMO_PEOPLE } from "./demoPeople";
import { findPerson } from "./directory";
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

/** Legacy Premier trial helper — Premier is retired; kept for stored profiles. */
function trialEndsAt(from = new Date(), days = 3): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

const PROFILE_KEY = "meetpoint.profile";
const CONNECTIONS_KEY = "meetpoint.connections";
const CHATS_KEY = "meetpoint.chats";
const RATINGS_KEY = "meetpoint.ratings";
const BLOCKS_KEY = "meetpoint.blocked";

/** The "Enter demo" account signs itself with this LinkedIn value. */
const DEMO_PROFILE_MARKER = "linkedin.com/in/conclave-demo";

/** Demo runs entirely in this browser — it never reaches the shared database. */
export function isDemoProfile(p: MyProfile | null | undefined): boolean {
  return (p?.verifications || []).some((v) =>
    String(v.value || "").includes(DEMO_PROFILE_MARKER)
  );
}

function isDemoPeer(peerId: string): boolean {
  return DEMO_PEOPLE.some((p) => p.id === peerId);
}

export function loadProfile(): MyProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as MyProfile;

    // With demo mode off, a browser that once used it shouldn't keep that member alive.
    if (!demoEntryEnabled() && isDemoProfile(p)) {
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

    return p;
  } catch {
    return null;
  }
}

export function saveProfile(profile: MyProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  window.dispatchEvent(new CustomEvent("meetpoint:profile-changed"));
  // Persist so other devices / members can see you — except the demo member,
  // who would otherwise show up in the real room as a stranger.
  if (isDemoProfile(profile)) return;
  void import("./apiClient").then(({ syncProfileToServer }) => syncProfileToServer(profile));
}

/** Install the sample member and skip onboarding — demo mode only. */
export function enterAsDemo(): MyProfile {
  // Re-entering the demo shouldn't throw away BLACK if it was already claimed.
  const existing = loadProfile();
  const keepBlack = existing && isDemoProfile(existing) && existing.black;

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
    ...(keepBlack
      ? {
          black: true,
          blackSince: existing!.blackSince,
          blackSource: existing!.blackSource,
        }
      : {}),
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
  void import("./demoFlag").then(({ clearDemoOwnerSession }) => clearDemoOwnerSession());
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
    if (demoProfilesEnabled() && isDemoPeer(peerId)) {
      scheduleDemoAccept(peerId);
      return connections;
    }
    void import("./apiClient").then(async ({ requestServerConnection }) => {
      const remote = await requestServerConnection(peerId);
      if (remote) applyServerConnections(remote);
    });
  }
  return connections;
}

const pendingDemoAccepts = new Set<string>();

function scheduleDemoAccept(peerId: string) {
  if (pendingDemoAccepts.has(peerId)) return;
  pendingDemoAccepts.add(peerId);
  const delay = 4000 + Math.floor(Math.random() * 4000);
  setTimeout(() => {
    pendingDemoAccepts.delete(peerId);
    const before = getConnection(peerId);
    if (!before || before.status !== "requested" || before.direction === "in") return;
    acceptConnection(peerId);
    const first = DEMO_PEOPLE.find((p) => p.id === peerId)?.name.split(" ")[0] || "They";
    window.dispatchEvent(
      new CustomEvent("meetpoint:toast", {
        detail: {
          message: `${first} accepted your introduction. Press Chat when you’re ready to message them.`,
          peerId,
        },
      })
    );
    void import("./notify").then(({ pushAppNotification }) =>
      pushAppNotification(
        "Introduction accepted",
        `${first} accepted. Press Chat on their card when you want a thread.`,
        { url: "/chats", tag: "conclave-intro" }
      )
    );
  }, delay);
}

/** Re-arm sample accepts after a refresh. The timer does not survive a reload. */
function resumePendingDemoAccepts(): void {
  if (typeof window === "undefined" || !demoProfilesEnabled()) return;
  for (const conn of loadConnections()) {
    if (conn.status !== "requested" || conn.direction === "in") continue;
    if (!isDemoPeer(conn.peerId)) continue;
    scheduleDemoAccept(conn.peerId);
  }
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
  if (isDemoPeer(peerId)) return connections;
  void import("./apiClient").then(async ({ patchServerConnection }) => {
    const remote = await patchServerConnection(peerId, "accept");
    if (remote) applyServerConnections(remote);
  });
  return connections;
}

export function declineConnection(peerId: string): Connection[] {
  if (!isDemoPeer(peerId)) {
    void import("./apiClient").then(({ patchServerConnection }) =>
      patchServerConnection(peerId, "decline")
    );
  }
  return removeConnection(peerId);
}

export function removeConnection(peerId: string): Connection[] {
  const connections = loadConnections().filter((c) => c.peerId !== peerId);
  saveConnections(connections);
  window.dispatchEvent(new CustomEvent("meetpoint:connections-changed"));
  if (isDemoPeer(peerId)) return connections;
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

/**
 * Replace local connections with the signed-in member’s server list.
 * Sample introductions stay in this browser — they are not database rows,
 * and writing them back would be purged.
 */
export function applyServerConnections(remote: Connection[]): Connection[] {
  if (typeof window === "undefined") return remote;
  if (isDemoProfile(loadProfile())) {
    resumePendingDemoAccepts();
    return loadConnections();
  }
  const next = demoProfilesEnabled()
    ? mergeServerConnections(loadConnections(), remote, isDemoPeer)
    : remote;
  saveConnections(next);
  window.dispatchEvent(new CustomEvent("meetpoint:connections-changed"));
  resumePendingDemoAccepts();
  return next;
}

/** Merge `/api/chats` into local inbox so a cookie session isn’t an empty rail. */
export function mergeServerChats(remote: GroupChat[]): GroupChat[] {
  if (isDemoProfile(loadProfile())) return loadChats();
  const byId = new Map<string, GroupChat>();
  for (const chat of loadChats()) byId.set(chat.id, chat);
  for (const remoteChat of remote) {
    const existing = byId.get(remoteChat.id);
    if (!existing) {
      const messages = remoteChat.messages?.length
        ? remoteChat.messages
        : [
            {
              id: `sys-${remoteChat.id}`,
              senderId: "system",
              text: "This private room is open. Speak freely.",
              createdAt: remoteChat.createdAt,
            },
          ];
      byId.set(remoteChat.id, { ...remoteChat, messages });
      continue;
    }
    const msgById = new Map(existing.messages.map((m) => [m.id, m]));
    for (const message of remoteChat.messages || []) {
      if (!msgById.has(message.id)) msgById.set(message.id, message);
    }
    const messages = [...msgById.values()].sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt)
    );
    const remoteNewer = (remoteChat.updatedAt || "") > (existing.updatedAt || "");
    byId.set(remoteChat.id, {
      ...existing,
      name: remoteChat.name || existing.name,
      memberIds: remoteChat.memberIds?.length ? remoteChat.memberIds : existing.memberIds,
      updatedAt: remoteNewer ? remoteChat.updatedAt : existing.updatedAt,
      messages,
    });
  }
  const merged = Array.from(byId.values());
  saveChats(merged);
  return merged;
}

export function getChat(id: string): GroupChat | undefined {
  return loadChats().find((c) => c.id === id);
}

/** Rename a chat and/or set a group photo. Stored with local chats (API-ready later). */
export function updateChatMeta(
  chatId: string,
  patch: { name?: string; photo?: string | null }
): GroupChat | undefined {
  const chats = loadChats();
  const chat = chats.find((c) => c.id === chatId);
  if (!chat) return undefined;

  if (typeof patch.name === "string") {
    const next = patch.name.trim();
    if (next) chat.name = next.slice(0, 80);
  }
  if (patch.photo === null) {
    delete chat.photo;
  } else if (typeof patch.photo === "string") {
    chat.photo = patch.photo;
  }
  chat.updatedAt = new Date().toISOString();
  saveChats(chats);
  return chat;
}

/** Existing 1:1 thread with a peer, if the user has opened one. */
export function findDirectChat(peerId: string): GroupChat | undefined {
  return loadChats().find(
    (c) => c.memberIds.length === 1 && c.memberIds[0] === peerId
  );
}

/**
 * Find a chat with exactly the same member set (order-independent).
 * Used so “Chat” doesn’t spawn duplicates for the same people.
 */
export function findChatByMembers(memberIds: string[]): GroupChat | undefined {
  const want = [...new Set(memberIds)].sort().join(",");
  return loadChats().find(
    (c) => [...c.memberIds].sort().join(",") === want
  );
}

/**
 * Open an existing 1:1 or create it — only call when the user presses Chat.
 * Connections alone never create a thread.
 */
export function openOrCreateDirectChat(peerId: string, displayName: string): GroupChat {
  const existing = findDirectChat(peerId);
  if (existing) return existing;
  return createChat(displayName.trim().split(" ")[0] || "Chat", [peerId]);
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
  void import("./chatUnread").then(({ markChatRead }) => markChatRead(chat));

  // A chat with sample members stays in this browser.
  if (chat.memberIds.some(isDemoPeer)) return chat;

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
  if (trimmed && !chat.memberIds.some(isDemoPeer)) {
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
        const reply = {
          id: uid(),
          senderId: peerId,
          text: replies[Math.floor(Math.random() * replies.length)],
          createdAt: new Date().toISOString(),
        };
        c.messages.push(reply);
        c.updatedAt = new Date().toISOString();
        saveChats(latest);
        const peer = DEMO_PEOPLE.find((p) => p.id === peerId);
        void import("./chatUnread").then(({ noteIncomingMessage }) =>
          noteIncomingMessage({
            chatId,
            messageId: reply.id,
            title: peer?.name || c.name || "New message",
            preview: reply.text,
          })
        );
      }, 1200 + Math.random() * 1800);
    }
  }

  return chat;
}

export function deleteChat(chatId: string): GroupChat[] {
  const chats = loadChats().filter((c) => c.id !== chatId);
  saveChats(chats);
  void import("./chatMute").then(({ clearChatMute }) => clearChatMute(chatId));
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

/** Booked tables count toward earned BLACK standing. */
export function getMeetingsAttended(profile?: MyProfile | null): number {
  const p = profile ?? loadProfile();
  const fromProfile = p?.meetingsAttended ?? 0;
  const fromBookings = loadChats().filter((c) => c.tableProposal?.booked).length;
  return Math.max(fromProfile, fromBookings);
}
