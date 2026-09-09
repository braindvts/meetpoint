import { NextResponse } from "next/server";
import { publicError } from "@/lib/safeError";
import { getCurrentMember } from "@/lib/memberAuth";
import { rateLimit } from "@/lib/rateLimit";
import { parseBody } from "@/lib/validation/parse";
import { smsSchema } from "@/lib/validation/safety";

/**
 * Booking confirmation SMS.
 * Requires a signed-in member. Twilio credentials stay server-side.
 * Optional NOTIFY_SECRET via x-conclave-notify for service-to-service calls.
 */
export async function POST(req: Request) {
  const limited = rateLimit(req, { name: "sms", limit: 12, windowMs: 60_000 });
  if (!limited.ok) return limited.response;

  const secret = process.env.NOTIFY_SECRET?.trim();
  if (secret) {
    const got = req.headers.get("x-conclave-notify") || "";
    if (got !== secret) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  } else {
    const me = await getCurrentMember();
    if (!me) {
      return NextResponse.json({ ok: false, error: "Sign in first" }, { status: 401 });
    }
  }

  const parsed = await parseBody(req, smsSchema);
  if (!parsed.ok) return parsed.response;
  const { to, body: text } = parsed.data;

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
        return NextResponse.json({ ok: false, error: "SMS provider failed" }, { status: 502 });
      }
      return NextResponse.json({ ok: true, provider: "twilio" });
    } catch (e) {
      return publicError(e, "SMS failed", 502);
    }
  }

  console.info("[conclave sms skipped]", { to, body: text.slice(0, 80) });
  return NextResponse.json({ ok: true, provider: "none" });
}
