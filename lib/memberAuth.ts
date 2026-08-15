import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Member } from "@prisma/client";
import { prisma } from "./db";
import { getSession, signValue, verifyValue } from "./session";

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
  res.cookies.set(MEMBER_COOKIE, signValue(memberId), cookieOpts(60 * 60 * 24 * 365));
  return res;
}

export async function clearMemberCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(MEMBER_COOKIE);
}

/** Resolve the signed-in Conclave member (LinkedIn session and/or member cookie). */
export async function getCurrentMember(): Promise<Member | null> {
  const session = await getSession();
  if (session?.id) {
    const byLi = await prisma.member.findUnique({ where: { linkedInId: session.id } });
    if (byLi) return byLi;
  }

  const cookieId = await getMemberIdFromCookie();
  if (cookieId) {
    const byId = await prisma.member.findUnique({ where: { id: cookieId } });
    if (byId) return byId;
  }

  return null;
}
