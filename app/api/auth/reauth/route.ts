import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/memberAuth";
import { rateLimit } from "@/lib/rateLimit";
import { hasRecentReauth, withReauth } from "@/lib/session";
import { reauthSchema } from "@/lib/validation/auth";
import { parseBody } from "@/lib/validation/parse";
import { verifyPassword } from "@/lib/password";

/**
 * Step-up re-authentication — confirms password and issues a 10-minute
 * httpOnly reauth cookie for sensitive actions (billing, BLACK, grants).
 */
export async function POST(req: Request) {
  const limited = rateLimit(req, { name: "reauth", limit: 10, windowMs: 60_000 });
  if (!limited.ok) return limited.response;

  const me = await getCurrentMember();
  if (!me) {
    return NextResponse.json({ ok: false, error: "Sign in first" }, { status: 401 });
  }

  const parsed = await parseBody(req, reauthSchema);
  if (!parsed.ok) return parsed.response;

  if (!me.passwordHash || !verifyPassword(parsed.data.password, me.passwordHash)) {
    return NextResponse.json({ ok: false, error: "Password incorrect" }, { status: 401 });
  }

  const res = NextResponse.json({
    ok: true,
    reauth: true,
    expiresInSec: 600,
  });
  return withReauth(res, me.id);
}

export async function GET() {
  const me = await getCurrentMember();
  if (!me) {
    return NextResponse.json({ ok: false, active: false }, { status: 401 });
  }
  const active = await hasRecentReauth(me.id);
  return NextResponse.json({ ok: true, active });
}
