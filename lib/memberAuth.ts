import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Member } from "@prisma/client";
import { prisma } from "./db";
import { memberAuthSource } from "./safetyRules";
import { getSession, readMemberCookie, signMemberCookie, type AuthSession } from "./session";

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
  return readMemberCookie(raw);
}

export function withMemberCookie(res: NextResponse, memberId: string): NextResponse {
  res.cookies.set(MEMBER_COOKIE, signMemberCookie(memberId), cookieOpts(60 * 60 * 24 * 7));
  return res;
}

export async function clearMemberCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(MEMBER_COOKIE);
}

function activeMember(member: Member | null): Member | null {
  if (!member || member.deletedAt) return null;
  return member;
}

async function memberFromSession(session: AuthSession): Promise<Member | null> {
  if (session.provider === "linkedin" && session.id) {
    // A LinkedIn login matches only its own linkedInId. The email LinkedIn
    // returns is not an account link.
    return activeMember(
      await prisma.member.findFirst({ where: { linkedInId: session.id, deletedAt: null } })
    );
  }
  if (session.provider === "google" && session.id) {
    const byG = await prisma.member.findFirst({
      where: { googleId: session.id, deletedAt: null },
    });
    if (byG) return byG;
  } else if (session.provider === "apple" && session.id) {
    const byA = await prisma.member.findFirst({
      where: { appleId: session.id, deletedAt: null },
    });
    if (byA) return byA;
  } else if (session.provider === "email" && session.id) {
    const byId = await prisma.member.findUnique({ where: { id: session.id } });
    if (byId && !byId.deletedAt) return byId;
  }

  if (session.email) {
    const byEmail = await prisma.member.findFirst({
      where: { email: session.email, deletedAt: null },
    });
    if (byEmail) return byEmail;
  }
  return null;
}

/**
 * Resolve the signed-in member.
 * A live session that does not match a member returns null — it does not
 * fall through to a leftover member cookie from another account.
 * An anonymized account (deletedAt) is treated as signed out.
 */
export async function getCurrentMember(): Promise<Member | null> {
  const session = await getSession();
  const cookieId = session ? null : await getMemberIdFromCookie();
  const sessionMember = session ? await memberFromSession(session) : null;
  const source = memberAuthSource(!!session, !!sessionMember, !!cookieId);
  if (source === "session") return sessionMember;
  if (source === "cookie" && cookieId) {
    return activeMember(await prisma.member.findUnique({ where: { id: cookieId } }));
  }
  return null;
}
