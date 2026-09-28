import { NextResponse } from "next/server";
import { clearMemberCookie } from "@/lib/memberAuth";
import { clearSession } from "@/lib/session";

export async function POST() {
  await clearSession();
  await clearMemberCookie();
  return NextResponse.json({ ok: true });
}
