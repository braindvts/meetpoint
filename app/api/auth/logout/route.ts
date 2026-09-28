import { NextResponse } from "next/server";
import { clearMemberCookie } from "@/lib/memberAuth";
import { appUrl, clearSession } from "@/lib/session";

export async function POST() {
  await clearSession();
  await clearMemberCookie();
  return NextResponse.json({ ok: true });
}

export async function GET() {
  await clearSession();
  await clearMemberCookie();
  return NextResponse.redirect(appUrl("/"));
}
