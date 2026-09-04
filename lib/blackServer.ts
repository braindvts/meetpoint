import type { Member } from "@prisma/client";
import { prisma } from "./db";
import { qualifiesForEarnedBlack, type BlackSource } from "./black";
import { scoreProfileStrength, reputationScoreForMeetings } from "./tiers";
import type { PersonWork, Verification } from "./types";

/**
 * Server-side BLACK rules. Every status change goes through here so the client
 * can never talk itself into BLACK or into a BLACK CONNECTION.
 */

function parse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function memberVerifications(m: Member): Verification[] {
  return parse<Verification[]>(m.verificationsJson, []);
}

export function isVerified(m: Member): boolean {
  return memberVerifications(m).length > 0;
}

/** Profile strength from stored fields — never from anything the client asserts. */
export function memberProfileStrength(m: Member): number {
  return scoreProfileStrength({
    verifications: memberVerifications(m),
    bio: m.bio,
    phone: m.phone || undefined,
    work: parse<PersonWork[]>(m.workJson, []),
    ideaTags: parse<string[]>(m.ideaTagsJson, []),
    lookingFor: parse<string[]>(m.lookingForJson, []) as never,
  }).score;
}

export function memberQualifiesForEarnedBlack(m: Member): boolean {
  return qualifiesForEarnedBlack({
    verified: isVerified(m),
    meetingsAttended: m.meetingsAttended,
    reputationScore: reputationScoreForMeetings(m.meetingsAttended),
    profileStrength: memberProfileStrength(m),
  });
}

export async function setBlack(memberId: string, source: BlackSource): Promise<Member> {
  return prisma.member.update({
    where: { id: memberId },
    data: { black: true, blackSince: new Date(), blackSource: source },
  });
}

export async function clearBlack(memberId: string): Promise<Member> {
  return prisma.member.update({
    where: { id: memberId },
    data: { black: false, blackSince: null, blackSource: null },
  });
}

/** How many BLACK network connections a member holds, in either role. */
export async function blackConnectionCount(memberId: string): Promise<number> {
  return prisma.blackConnection.count({
    where: { OR: [{ peerId: memberId }, { blackMemberId: memberId }] },
  });
}

export async function blackConnectionCounts(
  memberIds: string[]
): Promise<Record<string, number>> {
  if (!memberIds.length) return {};
  const rows = await prisma.blackConnection.findMany({
    where: {
      OR: [{ peerId: { in: memberIds } }, { blackMemberId: { in: memberIds } }],
    },
    select: { peerId: true, blackMemberId: true },
  });
  const counts: Record<string, number> = {};
  for (const row of rows) {
    for (const id of [row.peerId, row.blackMemberId]) {
      if (memberIds.includes(id)) counts[id] = (counts[id] || 0) + 1;
    }
  }
  return counts;
}

export interface BlackPairing {
  blackMemberId: string;
  peerId: string;
}

/**
 * Resolve which side of a pairing is BLACK. Returns null unless exactly one of
 * them is BLACK — two BLACK members don't need the credential, and two
 * ordinary members can't mint one.
 */
export function resolvePairing(a: Member, b: Member): BlackPairing | null {
  if (a.black === b.black) return null;
  const blackMember = a.black ? a : b;
  const peer = a.black ? b : a;
  return { blackMemberId: blackMember.id, peerId: peer.id };
}

/** Idempotent: the unique pair means a connection is only ever counted once. */
export async function awardBlackConnection(
  pairing: BlackPairing,
  source: "invite" | "meeting"
): Promise<{ created: boolean }> {
  const existing = await prisma.blackConnection.findUnique({
    where: {
      blackMemberId_peerId: {
        blackMemberId: pairing.blackMemberId,
        peerId: pairing.peerId,
      },
    },
  });
  if (existing) return { created: false };

  await prisma.blackConnection.create({
    data: { ...pairing, source },
  });
  return { created: true };
}
