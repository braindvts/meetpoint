import type { Person } from "./types";

const KEY = "conclave.directory";

/** Client-side cache of the real member directory from /api/members. */
export function loadDirectory(): Person[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Person[]) : [];
  } catch {
    return [];
  }
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
