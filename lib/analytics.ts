/** First-party beacon. sendBeacon so a new tab does not drop the click. */
function sendFirstParty(name: string, meta?: Record<string, string>): void {
  if (typeof window === "undefined") return;
  const path = window.location.pathname;
  const body = JSON.stringify(meta ? { name, path, meta } : { name, path });
  try {
    if (typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon("/api/analytics", blob)) return;
    }
  } catch {
    /* fetch fallback */
  }
  void fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}

export function trackPartnerClick(
  partnerId: string,
  placement: "landing" | "loading" | "featured"
): void {
  sendFirstParty("partner_click", { partner: partnerId, placement });
}

/** Fire-and-forget product events (+ optional Plausible if configured). */
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
  sendFirstParty("pageview");
}
