import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_MS,
  adminCookieOptions,
  signAdminCookie,
} from "@/lib/adminGate";

/** Exchange ADMIN_SECRET for the httpOnly admin cookie used by /admin/analytics. */
export async function POST(req: Request) {
  const gate = requireAdmin(req);
  if (!gate.ok) return gate.response;
  const secret = process.env.ADMIN_SECRET?.trim() || "";
  const res = NextResponse.json({ ok: true });
  res.cookies.set(
    ADMIN_COOKIE,
    signAdminCookie(secret),
    adminCookieOptions(Math.floor(ADMIN_SESSION_MS / 1000))
  );
  return res;
}
