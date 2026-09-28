"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_MS,
  adminCookieOptions,
  secretsMatch,
  signAdminCookie,
} from "@/lib/adminGate";

export async function unlockAdmin(formData: FormData): Promise<void> {
  const expected = process.env.ADMIN_SECRET?.trim() || "";
  const got = String(formData.get("secret") || "");
  if (!expected) redirect("/admin/enter?error=config");
  if (!secretsMatch(got, expected)) redirect("/admin/enter?error=1");

  const jar = await cookies();
  jar.set(ADMIN_COOKIE, signAdminCookie(expected), adminCookieOptions(Math.floor(ADMIN_SESSION_MS / 1000)));
  redirect("/admin/analytics");
}
