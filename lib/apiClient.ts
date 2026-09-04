import type { Connection, GroupChat, MyProfile, Person } from "./types";

/** Sync local membership to SQLite / multi-device backend. */
export async function syncProfileToServer(profile: MyProfile): Promise<string | null> {
  try {
    const res = await fetch("/api/members/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile }),
    });
    const data = (await res.json()) as { ok?: boolean; memberId?: string };
    return data.ok ? data.memberId || null : null;
  } catch {
    return null;
  }
}

export async function fetchServerMembers(): Promise<Person[] | null> {
  try {
    const res = await fetch("/api/members");
    const data = (await res.json()) as { ok?: boolean; members?: Person[] };
    return data.ok && data.members ? data.members : null;
  } catch {
    return null;
  }
}

export async function fetchServerConnections(): Promise<Connection[] | null> {
  try {
    const res = await fetch("/api/connections");
    const data = (await res.json()) as { ok?: boolean; connections?: Connection[] };
    return data.ok && data.connections ? data.connections : null;
  } catch {
    return null;
  }
}

export async function requestServerConnection(peerId: string): Promise<Connection[] | null> {
  try {
    const res = await fetch("/api/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ peerId }),
    });
    const data = (await res.json()) as { ok?: boolean; connections?: Connection[] };
    return data.ok && data.connections ? data.connections : null;
  } catch {
    return null;
  }
}

export async function patchServerConnection(
  peerId: string,
  action: "accept" | "decline" | "remove"
): Promise<Connection[] | null> {
  try {
    const res = await fetch("/api/connections", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ peerId, action }),
    });
    const data = (await res.json()) as { ok?: boolean; connections?: Connection[] };
    return data.ok && data.connections ? data.connections : null;
  } catch {
    return null;
  }
}

export async function fetchServerChats(): Promise<GroupChat[] | null> {
  try {
    const res = await fetch("/api/chats");
    const data = (await res.json()) as { ok?: boolean; chats?: GroupChat[] };
    return data.ok && data.chats ? data.chats : null;
  } catch {
    return null;
  }
}

export async function startPremierCheckout(
  interval: "month" | "year"
): Promise<{ url?: string; stripeConfigured?: boolean } | null> {
  try {
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: interval === "year" ? "premier_year" : "premier_month",
      }),
    });
    return (await res.json()) as { url?: string; stripeConfigured?: boolean };
  } catch {
    return null;
  }
}

export async function startBlackCheckout(
  interval: "month" | "year"
): Promise<{ url?: string; stripeConfigured?: boolean } | null> {
  try {
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: interval === "year" ? "black_year" : "black_month" }),
    });
    return (await res.json()) as { url?: string; stripeConfigured?: boolean };
  } catch {
    return null;
  }
}

export async function startBookingCheckout(opts: {
  amountUsd: number;
  label: string;
  chatId: string;
  meetupAt: string;
  phone: string;
}): Promise<{ url?: string; stripeConfigured?: boolean; error?: string } | null> {
  try {
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "booking",
        amountUsd: opts.amountUsd,
        label: opts.label,
        chatId: opts.chatId,
        meetupAt: opts.meetupAt,
        phone: opts.phone,
      }),
    });
    return (await res.json()) as { url?: string; stripeConfigured?: boolean; error?: string };
  } catch {
    return null;
  }
}

export async function searchPlaces(opts: {
  q?: string;
  city?: string;
  lat?: number;
  lng?: number;
}) {
  const params = new URLSearchParams();
  if (opts.q) params.set("q", opts.q);
  if (opts.city) params.set("city", opts.city);
  if (opts.lat != null) params.set("lat", String(opts.lat));
  if (opts.lng != null) params.set("lng", String(opts.lng));
  const res = await fetch(`/api/places/search?${params}`);
  return res.json();
}

export async function fetchBlockedIds(): Promise<string[] | null> {
  try {
    const res = await fetch("/api/blocks");
    const data = (await res.json()) as { ok?: boolean; blockedIds?: string[] };
    return data.ok && data.blockedIds ? data.blockedIds : null;
  } catch {
    return null;
  }
}

export async function setBlocked(
  peerId: string,
  action: "block" | "unblock"
): Promise<string[] | null> {
  try {
    const res = await fetch("/api/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ peerId, action }),
    });
    const data = (await res.json()) as { ok?: boolean; blockedIds?: string[] };
    return data.ok && data.blockedIds ? data.blockedIds : null;
  } catch {
    return null;
  }
}
