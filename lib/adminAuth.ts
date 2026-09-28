import { NextResponse } from "next/server";
import { secretsMatch } from "@/lib/secretCompare";

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

/**
 * Gate for the report queue (/api/report GET and PATCH, /admin/reports).
 * Today this is ADMIN_SECRET via requireAdmin.
 * When lib/adminGate.ts from PR #25 is on this branch, switch this body to
 * canViewAdminDashboard and leave every caller on requireReportAdmin.
 * Do not reimplement ADMIN_EMAILS verification here.
 */
export function requireReportAdmin(req: Request) {
  return requireAdmin(req);
}
