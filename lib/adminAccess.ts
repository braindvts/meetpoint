import "server-only";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, adminIdentityFromAuth, canViewAdminDashboard } from "./adminGate";
import { getCurrentMember } from "./memberAuth";
import { getSession } from "./session";

/** Same gate as the analytics page. False means do not render admin UI. */
export async function canViewAdminFromRequest(): Promise<boolean> {
  const jar = await cookies();
  let session = null;
  try {
    session = await getSession();
  } catch {
    session = null;
  }
  let member = null;
  try {
    member = await getCurrentMember();
  } catch {
    member = null;
  }
  return canViewAdminDashboard({
    ...adminIdentityFromAuth(member, session),
    cookie: jar.get(ADMIN_COOKIE)?.value,
    adminEmails: process.env.ADMIN_EMAILS,
    adminSecret: process.env.ADMIN_SECRET,
  });
}
