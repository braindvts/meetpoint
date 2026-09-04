import { demoProfilesEnabled } from "./demoFlag";
import { DEMO_PEOPLE } from "./demoPeople";
import type { Person } from "./types";

const KEY = "conclave.directory";

/** Real members from /api/members, plus the sample members in demo mode. */
export function loadDirectory(): Person[] {
  if (typeof window === "undefined") {
    return demoProfilesEnabled() ? DEMO_PEOPLE : [];
  }
  const byId = new Map<string, Person>();
  if (demoProfilesEnabled()) {
    for (const p of DEMO_PEOPLE) byId.set(p.id, p);
  }
  try {
    const raw = localStorage.getItem(KEY);
    const cached = raw ? (JSON.parse(raw) as Person[]) : [];
    for (const p of cached) byId.set(p.id, p);
  } catch {
    /* ignore */
  }
  return [...byId.values()];
}

export function saveDirectory(people: Person[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(people));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent("meetpoint:directory-changed"));
}

export function findPerson(id: string): Person | undefined {
  return loadDirectory().find((p) => p.id === id);
}

export async function refreshDirectory(): Promise<Person[]> {
  try {
    const res = await fetch("/api/members");
    const data = (await res.json()) as { ok?: boolean; members?: Person[] };
    if (data.ok && data.members) {
      saveDirectory(data.members);
      return loadDirectory();
    }
  } catch {
    /* ignore */
  }
  return loadDirectory();
}
