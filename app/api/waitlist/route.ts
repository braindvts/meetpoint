import { NextResponse } from "next/server";
import {
  createWaitlistSignup,
  getWaitlistFormUrl,
  isWaitlistApiConfigured,
  parseWaitlistInput,
} from "@/lib/waitlist";

const hits = new Map<string, { n: number; t: number }>();

function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for") || "";
  return forwarded.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const row = hits.get(ip);
  if (!row || now - row.t > 60_000) {
    hits.set(ip, { n: 1, t: now });
    return false;
  }
  row.n += 1;
  return row.n > 8;
}

function statusPayload() {
  const configured = isWaitlistApiConfigured();
  return {
    ok: true,
    configured,
    formUrl: configured ? undefined : getWaitlistFormUrl(),
  };
}

export async function GET() {
  return NextResponse.json(statusPayload());
}

export async function POST(req: Request) {
  if (rateLimited(clientIp(req))) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Wait a minute and try again." },
      { status: 429 },
    );
  }

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const parsed = parseWaitlistInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  if (!isWaitlistApiConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        fallback: true,
        formUrl: getWaitlistFormUrl(),
        error: "Waitlist API is not connected. Use the form to finish.",
      },
      { status: 503 },
    );
  }

  const result = await createWaitlistSignup(parsed.value);
  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        configured: true,
        error: result.error,
        formUrl: getWaitlistFormUrl(),
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    already: Boolean(result.already),
  });
}
