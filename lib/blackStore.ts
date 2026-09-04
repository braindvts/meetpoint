"use client";

import {
  blackConnectionLevel,
  type BlackConnectionLevel,
  type BlackConnectionSource,
  type BlackInviteKind,
  type BlackInviteStatus,
} from "./black";
import {
  activateBlack,
  fetchBlackStatus,
  reportBlackMeeting,
  respondToBlackInvite,
  sendBlackInvite,
} from "./blackClient";
import { DEMO_PEOPLE } from "./demoPeople";
import { findPerson } from "./directory";
import { isDemoProfile, loadProfile, saveProfile } from "./store";

/**
 * Client mirror of the BLACK network.
 *
 * For real members the server is the authority and this is only a cache for
 * instant feedback. Demo members never touch the database, so for them these
 * records are the whole story — the same rules are enforced either way:
 * exactly one side must be BLACK, a pair can only award once, and accepting an
 * invitation never grants BLACK.
 */

const INVITES_KEY = "conclave.black.invites";
const CONNECTIONS_KEY = "conclave.black.connections";

export interface LocalBlackInvite {
  id: string;
  peerId: string;
  chatId?: string;
  kind: BlackInviteKind;
  status: BlackInviteStatus;
  /** "out" = I raised it, "in" = it's waiting on me. */
  direction: "in" | "out";
  /** True when the BLACK side is me. */
  fromBlack: boolean;
  createdAt: string;
}

export interface LocalBlackConnection {
  peerId: string;
  source: BlackConnectionSource;
  /** True when I am the BLACK party and they hold the credential. */
  iAmBlack: boolean;
  createdAt: string;
}

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, rows: T[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(rows));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent("meetpoint:black-changed"));
}

function uid(): string {
  return `bk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isDemoPeer(peerId: string): boolean {
  return DEMO_PEOPLE.some((p) => p.id === peerId);
}

export function loadBlackInvites(): LocalBlackInvite[] {
  return read<LocalBlackInvite>(INVITES_KEY);
}

export function loadBlackConnections(): LocalBlackConnection[] {
  return read<LocalBlackConnection>(CONNECTIONS_KEY);
}

/** My BLACK standing. Never inferred from a connection count. */
export function amBlack(): boolean {
  return loadProfile()?.black === true;
}

export function isPeerBlack(peerId: string): boolean {
  return findPerson(peerId)?.black === true;
}

export function myBlackConnectionCount(): number {
  return loadBlackConnections().length;
}

export function myBlackConnectionLevel(): BlackConnectionLevel {
  return blackConnectionLevel(myBlackConnectionCount());
}

/** The credential belongs to whoever isn't BLACK, so only count those. */
export function holdsBlackConnection(): boolean {
  return loadBlackConnections().some((c) => !c.iAmBlack);
}

export function blackConnectionWith(peerId: string): LocalBlackConnection | undefined {
  return loadBlackConnections().find((c) => c.peerId === peerId);
}

export function blackInviteWith(peerId: string, kind?: BlackInviteKind) {
  return loadBlackInvites().find(
    (i) => i.peerId === peerId && (!kind || i.kind === kind) && i.status === "pending"
  );
}

export function pendingBlackInvitesForMe(): LocalBlackInvite[] {
  return loadBlackInvites().filter((i) => i.direction === "in" && i.status === "pending");
}

/** Exactly one side BLACK, and no existing connection for the pair. */
export function canRaiseBlackInvite(peerId: string): boolean {
  const mine = amBlack();
  const theirs = isPeerBlack(peerId);
  if (mine === theirs) return false;
  if (blackConnectionWith(peerId)) return false;
  return true;
}

function recordConnection(peerId: string, source: BlackConnectionSource): boolean {
  const rows = loadBlackConnections();
  if (rows.some((c) => c.peerId === peerId)) return false;
  rows.push({
    peerId,
    source,
    iAmBlack: amBlack(),
    createdAt: new Date().toISOString(),
  });
  write(CONNECTIONS_KEY, rows);
  return true;
}

export interface RaiseResult {
  ok: boolean;
  error?: string;
  invite?: LocalBlackInvite;
}

/**
 * Raise a BLACK invitation from inside a private conversation. A BLACK member
 * extends one; everyone else requests one from a BLACK member.
 */
export async function raiseBlackInvite(opts: {
  peerId: string;
  chatId?: string;
  kind: BlackInviteKind;
}): Promise<RaiseResult> {
  const { peerId, chatId, kind } = opts;
  if (!canRaiseBlackInvite(peerId)) {
    return {
      ok: false,
      error: amBlack() === isPeerBlack(peerId)
        ? "BLACK invitations only apply between a BLACK member and someone who isn't."
        : "You already hold a BLACK connection with them.",
    };
  }
  if (blackInviteWith(peerId, kind)) {
    return { ok: false, error: "That invitation is already waiting on them." };
  }

  const invite: LocalBlackInvite = {
    id: uid(),
    peerId,
    chatId,
    kind,
    status: "pending",
    direction: "out",
    fromBlack: amBlack(),
    createdAt: new Date().toISOString(),
  };

  if (!isDemoPeer(peerId)) {
    const remote = await sendBlackInvite({ peerId, chatId, kind });
    if (!remote?.ok) {
      return { ok: false, error: remote?.error || "Could not send that invitation." };
    }
    if (remote.invite?.id) invite.id = remote.invite.id;
  }

  write(INVITES_KEY, [...loadBlackInvites(), invite]);
  return { ok: true, invite };
}

export interface RespondResult {
  ok: boolean;
  error?: string;
  status?: BlackInviteStatus;
  awarded?: boolean;
  awaitingMeeting?: boolean;
  level?: BlackConnectionLevel;
}

/** Accept or decline. Awards BLACK CONNECTION, never BLACK. */
export async function respondBlackInvite(
  inviteId: string,
  action: "accept" | "decline"
): Promise<RespondResult> {
  const invites = loadBlackInvites();
  const invite = invites.find((i) => i.id === inviteId);
  if (!invite) return { ok: false, error: "That invitation is gone." };
  if (invite.direction !== "in") {
    return { ok: false, error: "Only the person invited can answer this." };
  }
  if (invite.status !== "pending") {
    return { ok: false, error: `Already ${invite.status}.` };
  }

  if (!isDemoPeer(invite.peerId)) {
    const remote = await respondToBlackInvite({ inviteId, action });
    if (!remote?.ok) {
      return { ok: false, error: remote?.error || "Could not answer that invitation." };
    }
    invite.status = action === "accept" ? "accepted" : "declined";
    write(INVITES_KEY, invites);
    if (action === "accept" && !remote.awaitingMeeting) {
      recordConnection(invite.peerId, invite.kind === "meeting" ? "meeting" : "invite");
    }
    return {
      ok: true,
      status: invite.status,
      awarded: !!remote.awarded,
      awaitingMeeting: !!remote.awaitingMeeting,
      level: remote.blackConnections || myBlackConnectionLevel(),
    };
  }

  invite.status = action === "accept" ? "accepted" : "declined";
  write(INVITES_KEY, invites);

  if (action === "decline") return { ok: true, status: "declined", awarded: false };

  // A meeting invitation only settles once the table is booked.
  if (invite.kind === "meeting") {
    return { ok: true, status: "accepted", awarded: false, awaitingMeeting: true };
  }

  const awarded = recordConnection(invite.peerId, "invite");
  return { ok: true, status: "accepted", awarded, level: myBlackConnectionLevel() };
}

/**
 * Called once a table is booked. Awards BLACK CONNECTION only when a meeting
 * invitation between the two was accepted first.
 */
export async function settleBlackMeeting(peerId: string): Promise<{
  awarded: boolean;
  level?: BlackConnectionLevel;
}> {
  if (amBlack() === isPeerBlack(peerId)) return { awarded: false };
  if (blackConnectionWith(peerId)) return { awarded: false };

  const accepted = loadBlackInvites().some(
    (i) => i.peerId === peerId && i.kind === "meeting" && i.status === "accepted"
  );
  if (!accepted) return { awarded: false };

  if (!isDemoPeer(peerId)) {
    const remote = await reportBlackMeeting(peerId);
    if (!remote?.ok || !remote.awarded) return { awarded: false };
    recordConnection(peerId, "meeting");
    return { awarded: true, level: remote.blackConnections || myBlackConnectionLevel() };
  }

  const awarded = recordConnection(peerId, "meeting");
  return { awarded, level: myBlackConnectionLevel() };
}

/** Demo peers answer on their own after a beat, so flows can be walked through. */
export function scheduleDemoInviteResponse(inviteId: string, peerId: string): void {
  if (!isDemoPeer(peerId)) return;
  const delay = 3500 + Math.floor(Math.random() * 2500);
  setTimeout(() => {
    const invites = loadBlackInvites();
    const invite = invites.find((i) => i.id === inviteId);
    if (!invite || invite.status !== "pending") return;

    invite.status = "accepted";
    write(INVITES_KEY, invites);

    const person = findPerson(peerId);
    const first = person?.name.split(" ")[0] || "They";

    if (invite.kind === "meeting") {
      window.dispatchEvent(
        new CustomEvent("meetpoint:toast", {
          detail: { message: `${first} accepted the business meeting. Book the table to settle it.`, peerId },
        })
      );
      return;
    }

    const awarded = recordConnection(peerId, "invite");
    window.dispatchEvent(
      new CustomEvent("meetpoint:toast", {
        detail: {
          message: awarded
            ? `${first} accepted. You hold a BLACK CONNECTION.`
            : `${first} accepted.`,
          peerId,
        },
      })
    );
  }, delay);
}

/** Purchase or claim BLACK. The server decides for real members. */
export async function claimBlack(source: "paid" | "earned", sessionId?: string): Promise<{
  ok: boolean;
  error?: string;
  needsVerification?: boolean;
}> {
  const profile = loadProfile();
  if (!profile) return { ok: false, error: "Create your profile first." };

  // Paying never skips verification, in demo or otherwise.
  if (!profile.verifications?.length) {
    return {
      ok: false,
      needsVerification: true,
      error: "Verify your profile before BLACK can be activated.",
    };
  }

  if (!isDemoProfile(profile)) {
    const remote = await activateBlack({ source, sessionId });
    if (!remote?.ok) {
      return {
        ok: false,
        error: remote?.error || "Could not activate BLACK.",
        needsVerification: remote?.needsVerification,
      };
    }
  }

  saveProfile({
    ...profile,
    black: true,
    blackSince: new Date().toISOString(),
    blackSource: source,
  });
  return { ok: true };
}

/** Pull server truth into the mirror for real members. */
export async function syncBlackFromServer(): Promise<void> {
  const profile = loadProfile();
  if (!profile || isDemoProfile(profile)) return;
  const status = await fetchBlackStatus();
  if (!status) return;

  if (!!profile.black !== !!status.black || profile.blackSource !== status.blackSource) {
    saveProfile({
      ...profile,
      black: status.black,
      blackSource: status.blackSource || undefined,
      blackConnections: status.blackConnections.count,
    });
  }

  const local = loadBlackInvites();
  const merged = status.invites.map<LocalBlackInvite>((i) => ({
    id: i.id,
    peerId: i.peerId,
    chatId: i.chatId || undefined,
    kind: i.kind,
    status: i.status,
    direction: i.direction,
    fromBlack: i.direction === "out" ? !!status.black : !status.black,
    createdAt: String(i.createdAt),
  }));
  const demoOnly = local.filter((i) => isDemoPeer(i.peerId));
  write(INVITES_KEY, [...demoOnly, ...merged]);
}
