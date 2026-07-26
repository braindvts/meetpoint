"use client";

import type { Connection, Meetup, MyProfile } from "./types";

const PROFILE_KEY = "meetpoint.profile";
const CONNECTIONS_KEY = "meetpoint.connections";

export function loadProfile(): MyProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as MyProfile) : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile: MyProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function clearProfile(): void {
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(CONNECTIONS_KEY);
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

export function requestConnection(peerId: string): Connection[] {
  const connections = loadConnections();
  if (!connections.some((c) => c.peerId === peerId)) {
    connections.push({ peerId, status: "requested" });
    saveConnections(connections);
    // Demo mode: the other person "accepts" shortly after.
    setTimeout(() => acceptConnection(peerId), 1500);
  }
  return connections;
}

export function acceptConnection(peerId: string): void {
  const connections = loadConnections();
  const conn = connections.find((c) => c.peerId === peerId);
  if (conn && conn.status === "requested") {
    conn.status = "connected";
    saveConnections(connections);
    window.dispatchEvent(new CustomEvent("meetpoint:connections-changed"));
  }
}

export function removeConnection(peerId: string): Connection[] {
  const connections = loadConnections().filter((c) => c.peerId !== peerId);
  saveConnections(connections);
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
