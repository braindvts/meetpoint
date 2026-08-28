import { NextResponse } from "next/server";

/**
 * Booking confirmation SMS.
 * Uses Twilio when TWILIO_* env vars are set; otherwise demo success.
 * If NOTIFY_SECRET is set, require header x-conclave-notify.
 */

const hits = new Map<string, { n: number; t: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const row = hits.get(ip);
  if (!row || now - row.t > 60_000) {
    hits.set(ip, { n: 1, t: now });
    return false;
  }
  row.n += 1;
  return row.n > 12;
}

export async function POST(req: Request) {
  const secret = process.env.NOTIFY_SECRET;
  if (secret) {
    const got = req.headers.get("x-conclave-notify") || "";
    if (got !== secret) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    const app = process.env.NEXT_PUBLIC_APP_URL || "";
    const origin = req.headers.get("origin") || "";
    const referer = req.headers.get("referer") || "";
    const ok =
      !app ||
      (origin && origin.startsWith(app)) ||
      (referer && referer.startsWith(app));
    if (!ok) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local";
  if (rateLimited(ip)) {
    return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 });
  }

  let body: { to?: string; body?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const to = String(body.to || "").trim();
  const text = String(body.body || "").trim();
  if (!to || !text) {
    return NextResponse.json({ ok: false, error: "Missing to/body" }, { status: 400 });
  }
  if (text.length > 480) {
    return NextResponse.json({ ok: false, error: "Body too long" }, { status: 400 });
  }

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (sid && token && from) {
    try {
      const auth = Buffer.from(`${sid}:${token}`).toString("base64");
      const params = new URLSearchParams({ To: to, From: from, Body: text });
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        }
      );
      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json(
          { ok: false, error: "Twilio failed", detail: err.slice(0, 200) },
          { status: 502 }
        );
      }
      return NextResponse.json({ ok: true, provider: "twilio" });
    } catch (e) {
      return NextResponse.json(
        { ok: false, error: e instanceof Error ? e.message : "SMS failed" },
        { status: 502 }
      );
    }
  }

  console.info("[conclave sms demo]", { to, body: text.slice(0, 80) });
  return NextResponse.json({ ok: true, provider: "demo" });
}
