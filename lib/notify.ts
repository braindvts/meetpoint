/** In-app toast, device notifications, and booking SMS helpers. */

export function showToast(message: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("meetpoint:toast", { detail: { message } })
  );
}

export async function registerNotifyWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch {
    return null;
  }
}

export async function ensureNotifyPermission(): Promise<boolean> {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return false;
  }
  await registerNotifyWorker();
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  try {
    const result = await Notification.requestPermission();
    return result === "granted";
  } catch {
    return false;
  }
}

export async function pushAppNotification(
  title: string,
  body: string,
  opts?: { url?: string; tag?: string }
) {
  const ok = await ensureNotifyPermission();
  if (!ok) return;

  const tag = opts?.tag || "conclave";
  const data = { url: opts?.url || "/circle" };

  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg?.showNotification) {
      await reg.showNotification(title, {
        body,
        tag,
        data,
        icon: "/favicon.ico",
      });
      return;
    }
  } catch {
    /* fall through */
  }

  try {
    new Notification(title, { body, tag, data });
  } catch {
    /* ignore unsupported environments */
  }
}

export async function sendBookingSms(to: string, body: string) {
  try {
    await fetch("/api/notify/sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, body }),
    });
  } catch {
    /* booking UX continues even if SMS endpoint is offline */
  }
}

/** Alert everyone at the table: SMS to booker + app notifications for all names. */
export async function notifyTableBooked(opts: {
  restaurant: string;
  whenLabel: string;
  phone: string;
  memberNames: string[];
}) {
  const smsBody = `Conclave: Your table at ${opts.restaurant} is set for ${opts.whenLabel}. Coming soon — see you there.`;
  await sendBookingSms(opts.phone, smsBody);

  const everyone = opts.memberNames.join(", ");
  await pushAppNotification(
    "Table coming soon",
    `${opts.restaurant} · ${opts.whenLabel}. Alerts sent to ${everyone}.`,
    { url: "/chats", tag: "conclave-table" }
  );

  showToast(`Table confirmed. Text & alerts sent to ${everyone}.`);
}
