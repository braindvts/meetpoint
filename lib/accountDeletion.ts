import type { Prisma } from "@prisma/client";

export const ACCOUNT_DELETE_PHRASE = "DELETE";

export type DeletionDecision =
  | { ok: true }
  | { ok: false; status: 400 | 401; error: string; needsReauth?: boolean };

/**
 * Every account must pass the same freshness check as POST /api/auth/reauth
 * (`hasRecentReauth`). A missing or expired re-auth cookie is a stale session.
 * Typing DELETE is not enough on its own.
 */
export function accountDeletionDecision(input: {
  confirm: string;
  hasPassword?: boolean;
  recentReauth: boolean;
}): DeletionDecision {
  if (input.confirm !== ACCOUNT_DELETE_PHRASE) {
    return {
      ok: false,
      status: 400,
      error: `Type ${ACCOUNT_DELETE_PHRASE} to confirm account deletion.`,
    };
  }
  if (!input.recentReauth) {
    return {
      ok: false,
      status: 401,
      needsReauth: true,
      error: "Sign in again before deleting this account.",
    };
  }
  return { ok: true };
}

/**
 * Anonymize one account inside a transaction.
 * Report and Block rows stay, whether this member filed them or was named in them.
 * The member row is updated, not deleted, so a Block foreign key cannot cascade.
 */
export async function anonymizeDeletedAccount(tx: Prisma.TransactionClient, id: string) {
  await tx.message.updateMany({ where: { senderId: id }, data: { text: "" } });
  const memberships = await tx.chatMember.findMany({
    where: { memberId: id },
    select: { chatId: true },
  });
  const chatIds = memberships.map((row) => row.chatId);
  await tx.chatMember.deleteMany({ where: { memberId: id } });
  if (chatIds.length) {
    const remaining = await tx.chatMember.groupBy({
      by: ["chatId"],
      where: { chatId: { in: chatIds } },
      _count: { _all: true },
    });
    const still = new Set(remaining.map((row) => row.chatId));
    const empty = chatIds.filter((chatId) => !still.has(chatId));
    if (empty.length) {
      await tx.chat.deleteMany({ where: { id: { in: empty } } });
    }
  }
  await tx.connection.deleteMany({
    where: { OR: [{ fromId: id }, { toId: id }] },
  });
  await tx.blackInvite.deleteMany({
    where: { OR: [{ fromId: id }, { toId: id }] },
  });
  await tx.blackConnection.deleteMany({
    where: { OR: [{ blackMemberId: id }, { peerId: id }] },
  });
  await tx.memberInterest.deleteMany({ where: { memberId: id } });
  await tx.eventInterest.deleteMany({ where: { memberId: id } });
  await tx.analyticsEvent.updateMany({
    where: { memberId: id },
    data: { memberId: null },
  });
  await tx.emailVerificationToken.deleteMany({ where: { memberId: id } });
  await tx.member.update({
    where: { id },
    data: anonymizedMemberData(),
  });
}

/**
 * Personal fields cleared on the member row. The id stays so payment flags
 * and safety reports can still point at an anonymized record.
 */
export function anonymizedMemberData(now = new Date()) {
  return {
    name: "Deleted member",
    email: null as string | null,
    passwordHash: null as string | null,
    linkedInId: null as string | null,
    googleId: null as string | null,
    appleId: null as string | null,
    phone: null as string | null,
    jobTitle: "",
    bio: "",
    photo: "",
    cityName: "",
    cityCountry: "",
    cityLat: 0,
    cityLng: 0,
    travel: "worldwide",
    meetPreference: "open",
    lookingForJson: "[]",
    ideaTagsJson: "[]",
    verificationsJson: "[]",
    workJson: "[]",
    company: "",
    industry: "",
    emailVerifiedAt: null as string | null,
    deletedAt: now,
  };
}
