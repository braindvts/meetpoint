"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_MS,
  adminCookieOptions,
  secretsMatch,
  signAdminCookie,
} from "@/lib/adminGate";
import { limitAdminSecretAttempt } from "@/lib/adminSecretLimit";

async function attemptRequest(): Promise<Request> {
  const incoming = await headers();
  return new Request("https://interlink.local/admin/enter", {
    method: "POST",
    headers: {
      "x-forwarded-for": incoming.get("x-forwarded-for") || "",
      "x-real-ip": incoming.get("x-real-ip") || "",
    },
  });
}

export async function unlockAdmin(formData: FormData): Promise<void> {
  const limited = await limitAdminSecretAttempt(await attemptRequest());
  if (!limited.ok) redirect("/admin/enter?error=rate");

  const expected = process.env.ADMIN_SECRET?.trim() || "";
  const got = String(formData.get("secret") || "");
  if (!expected) redirect("/admin/enter?error=config");
  if (!secretsMatch(got, expected)) redirect("/admin/enter?error=1");

  const jar = await cookies();
  jar.set(ADMIN_COOKIE, signAdminCookie(expected), adminCookieOptions(Math.floor(ADMIN_SESSION_MS / 1000)));
  redirect("/admin/analytics");
}
