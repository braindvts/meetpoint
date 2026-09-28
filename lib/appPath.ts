const CONTROL = /[\u0000-\u001F\u007F]/;

function decodeOnce(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

function looksOffSite(value: string): boolean {
  const lower = value.trim().toLowerCase();
  if (!lower) return true;
  if (lower.startsWith("//")) return true;
  if (lower.startsWith("\\")) return true;
  if (lower.includes("\\")) return true;
  if (lower.includes("://")) return true;
  if (/^[a-z][a-z0-9+.-]*:/.test(lower)) return true;
  if (CONTROL.test(value)) return true;
  return false;
}

/**
 * Same-site relative path only.
 * Rejects absolute URLs, protocol-relative `//`, backslashes, and values
 * that become any of those after percent-decoding.
 */
export function safeAppPath(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  let path = String(raw).trim();
  if (!path || path.length > 512) return null;

  for (let i = 0; i < 3; i++) {
    if (looksOffSite(path)) return null;
    const decoded = decodeOnce(path);
    if (decoded == null) return null;
    if (decoded === path) break;
    path = decoded.trim();
  }

  const cleaned = cleanSingleSlashPath(path);
  if (!cleaned) return null;

  const again = decodeOnce(cleaned);
  if (again == null || again !== cleaned) {
    if (again == null || !cleanSingleSlashPath(again)) return null;
  }

  return cleaned;
}

/**
 * One leading slash, no empty / `.` / `..` segments, no second slash.
 * `/.//evil.com` is not a same-site path.
 */
function cleanSingleSlashPath(path: string): string | null {
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  if (path.includes("\\") || path.includes("//") || path.includes("://")) return null;
  if (looksOffSite(path)) return null;
  if (CONTROL.test(path) || /\s/.test(path)) return null;

  const hash = path.indexOf("#");
  const query = path.indexOf("?");
  let cut = path.length;
  if (query >= 0) cut = Math.min(cut, query);
  if (hash >= 0) cut = Math.min(cut, hash);
  const pathname = path.slice(0, cut);
  const suffix = path.slice(cut);
  if (!pathname.startsWith("/") || pathname.includes("//")) return null;

  const segments = pathname.split("/").slice(1);
  if (segments.some((part) => part === "" || part === "." || part === "..")) return null;
  if (segments.some((part) => part.includes(":") || part.includes("\\"))) return null;

  return `/${segments.join("/")}${suffix}`;
}

/** Where to send someone after a successful sign-in. */
export function postAuthPath(opts: {
  requested?: string | null;
  hasIdentity: boolean;
  /** Used when identity is still incomplete. */
  incomplete?: string;
}): string {
  if (!opts.hasIdentity) {
    return safeAppPath(opts.incomplete) || "/onboarding";
  }
  return safeAppPath(opts.requested) || "/discover";
}

export function loginUrl(next?: string | null): string {
  const path = safeAppPath(next);
  return path ? `/login?next=${encodeURIComponent(path)}` : "/login";
}
