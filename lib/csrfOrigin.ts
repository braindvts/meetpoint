/**
 * Production CSRF origins for this Vercel project.
 * Preview hosts look like meetpoint-<branch>-braindvts-projects.vercel.app.
 */

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
  if (host === "interlinkgobal.com" || host === "www.interlinkgobal.com") return true;
  if (host === "meetpoint-flax.vercel.app") return true;
  if (host.startsWith("meetpoint-") && host.endsWith("-braindvts-projects.vercel.app")) {
    return true;
  }
  return false;
}
