/**
 * Production CSRF origins for this deployment.
 * Preview hosts are allowed only when they are the exact hostname Vercel
 * set on this process (VERCEL_URL, VERCEL_BRANCH_URL, or
 * VERCEL_PROJECT_PRODUCTION_URL). A lookalike name in another account is not.
 */

const PRODUCTION_HOSTS = new Set([
  "interlinkgobal.com",
  "www.interlinkgobal.com",
  "meetpoint-flax.vercel.app",
]);

function hostnameOf(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;
  try {
    const withScheme = raw.includes("://") ? raw : `https://${raw}`;
    return new URL(withScheme).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function deploymentHosts(): string[] {
  const hosts: string[] = [];
  for (const key of ["VERCEL_URL", "VERCEL_BRANCH_URL", "VERCEL_PROJECT_PRODUCTION_URL"] as const) {
    const host = hostnameOf(process.env[key] || "");
    if (host) hosts.push(host);
  }
  return hosts;
}

export function csrfOriginAllowed(origin: string, appOrigin: string | null): boolean {
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }
  if (url.origin !== origin) return false;
  if (appOrigin && url.origin === appOrigin) return true;

  const host = url.hostname.toLowerCase();
  if (PRODUCTION_HOSTS.has(host)) return true;
  return deploymentHosts().includes(host);
}
