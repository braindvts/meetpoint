"use client";

import type { BlackConnectionLevel, BlackInviteKind } from "./black";

/** Client wrappers for the BLACK endpoints. The server decides everything. */

export interface BlackInviteView {
  id: string;
  kind: BlackInviteKind;
  status: "pending" | "accepted" | "declined";
  direction: "in" | "out";
  peerId: string;
  chatId?: string | null;
  createdAt: string;
}

export interface BlackStatus {
  black: boolean;
  blackSource?: "paid" | "earned" | "granted" | null;
  verified: boolean;
  qualifiesForEarnedBlack: boolean;
  blackConnections: BlackConnectionLevel;
  invites: BlackInviteView[];
}

async function post<T>(url: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchBlackStatus(): Promise<BlackStatus | null> {
  try {
    const res = await fetch("/api/black/status");
    const data = (await res.json()) as BlackStatus & { ok?: boolean };
    return data.ok ? data : null;
  } catch {
    return null;
  }
}

export async function activateBlack(opts: {
  source: "paid" | "earned";
  sessionId?: string;
}): Promise<{ ok?: boolean; error?: string; needsVerification?: boolean } | null> {
  return post("/api/black/activate", opts);
}

export async function sendBlackInvite(opts: {
  peerId: string;
  chatId?: string;
  kind: BlackInviteKind;
}): Promise<{ ok?: boolean; error?: string; invite?: BlackInviteView } | null> {
  return post("/api/black/invite", opts);
}

export async function respondToBlackInvite(opts: {
  inviteId: string;
  action: "accept" | "decline";
}): Promise<{
  ok?: boolean;
  error?: string;
  status?: string;
  awarded?: boolean;
  awaitingMeeting?: boolean;
  blackConnections?: BlackConnectionLevel;
} | null> {
  try {
    const res = await fetch("/api/black/invite", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(opts),
    });
    return await res.json();
  } catch {
    return null;
  }
}

/** Called after a table with a BLACK member is actually booked. */
export async function reportBlackMeeting(peerId: string): Promise<{
  ok?: boolean;
  awarded?: boolean;
  reason?: string;
  blackConnections?: BlackConnectionLevel;
} | null> {
  return post("/api/black/meeting", { peerId });
}
