/** Internal app path only — blocks protocol-relative and off-site URLs. */
export function safeAppPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const path = raw.trim();
  if (!path.startsWith("/")) return null;
  if (path.startsWith("//") || path.includes("://")) return null;
  if (path.includes("\\")) return null;
  return path;
}

export function loginUrl(next?: string | null): string {
  const path = safeAppPath(next);
  return path ? `/login?next=${encodeURIComponent(path)}` : "/login";
}
