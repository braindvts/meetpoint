import { loadConnections, loadProfile } from "@/lib/store";
import type { Connection, MyProfile } from "@/lib/types";

/** Sync read on the client so screens paint under the splash (no blank hang). */
export function readClientProfile(): MyProfile | null {
  if (typeof window === "undefined") return null;
  return loadProfile();
}

export function readClientConnections(): Connection[] {
  if (typeof window === "undefined") return [];
  return loadConnections();
}
