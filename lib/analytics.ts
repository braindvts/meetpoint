/** Fire-and-forget first-party analytics (+ optional Plausible if configured). */
export function track(name: string, meta?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  const path = window.location.pathname;
  void fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, path, meta }),
    keepalive: true,
  }).catch(() => undefined);

  const plausible = (
    window as Window & { plausible?: (n: string, o?: { props?: Record<string, unknown> }) => void }
  ).plausible;
  if (typeof plausible === "function") {
    try {
      plausible(name, meta ? { props: meta } : undefined);
    } catch {
      /* ignore */
    }
  }
}

export function trackPageview(): void {
  track("pageview");
}
