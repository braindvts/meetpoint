import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

function secretsMatch(got: string, expected: string): boolean {
  try {
    const a = Buffer.from(got);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Require Authorization: Bearer <ADMIN_SECRET> (or x-admin-secret). */
export function requireAdmin(req: Request):
  | { ok: true }
  | { ok: false; response: NextResponse } {
  const admin = process.env.ADMIN_SECRET?.trim();
  if (!admin) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "ADMIN_SECRET not set" },
        { status: 503 }
      ),
    };
  }

  const auth = req.headers.get("authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const headerSecret = req.headers.get("x-admin-secret")?.trim() || "";
  if (!secretsMatch(bearer || headerSecret, admin)) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { ok: true };
}
