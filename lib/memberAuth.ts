import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Member } from "@prisma/client";
import { prisma } from "./db";
import { memberAuthSource } from "./safetyRules";
import { getSession, signValue, verifyValue, type AuthSession } from "./session";

const MEMBER_COOKIE = "conclave_member";

function cookieOpts(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export async function getMemberIdFromCookie(): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(MEMBER_COOKIE)?.value;
  if (!raw) return null;
  return verifyValue(raw);
}

export function withMemberCookie(res: NextResponse, memberId: string): NextResponse {
  res.cookies.set(MEMBER_COOKIE, signValue(memberId), cookieOpts(60 * 60 * 24 * 7));
  return res;
}

export async function clearMemberCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(MEMBER_COOKIE);
}

async function memberFromSession(session: AuthSession): Promise<Member | null> {
  if (session.provider === "linkedin" && session.id) {
    const byLi = await prisma.member.findFirst({ where: { linkedInId: session.id } });
    if (byLi) return byLi;
  } else if (session.provider === "google" && session.id) {
    const byG = await prisma.member.findFirst({ where: { googleId: session.id } });
    if (byG) return byG;
  } else if (session.provider === "apple" && session.id) {
    const byA = await prisma.member.findFirst({ where: { appleId: session.id } });
    if (byA) return byA;
  } else if (session.provider === "email" && session.id) {
    const byId = await prisma.member.findUnique({ where: { id: session.id } });
    if (byId) return byId;
  }

  if (session.email) {
    const byEmail = await prisma.member.findFirst({ where: { email: session.email } });
    if (byEmail) return byEmail;
  }
  return null;
}

/**
 * Resolve the signed-in member.
 * A live session that does not match a member returns null — it does not
 * fall through to a leftover member cookie from another account.
 */
export async function getCurrentMember(): Promise<Member | null> {
  const session = await getSession();
  const cookieId = session ? null : await getMemberIdFromCookie();
  const sessionMember = session ? await memberFromSession(session) : null;
  const source = memberAuthSource(!!session, !!sessionMember, !!cookieId);
  if (source === "session") return sessionMember;
  if (source === "cookie" && cookieId) {
    return prisma.member.findUnique({ where: { id: cookieId } });
  }
  return null;
}
