import { prisma } from "@/lib/db";
import {
  emailTokenDecision,
  hashEmailToken,
  newEmailToken,
  normalizeAccountEmail,
  EMAIL_CONFIRM_TTL_MS,
} from "@/lib/emailConfirm";

export async function issueEmailConfirmation(memberId: string, email: string) {
  const normalized = normalizeAccountEmail(email);
  const { raw, hash } = newEmailToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + EMAIL_CONFIRM_TTL_MS);
  await prisma.$transaction([
    prisma.emailVerificationToken.updateMany({
      where: { memberId, usedAt: null },
      data: { usedAt: now },
    }),
    prisma.emailVerificationToken.create({
      data: { memberId, email: normalized, tokenHash: hash, expiresAt },
    }),
  ]);
  return { raw, email: normalized, expiresAt };
}

export async function consumeEmailConfirmation(
  rawToken: string
): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  const hash = hashEmailToken(rawToken.trim());
  const row = await prisma.emailVerificationToken.findUnique({ where: { tokenHash: hash } });
  const decision = emailTokenDecision(
    row
      ? {
          memberId: row.memberId,
          email: row.email,
          tokenHash: row.tokenHash,
          expiresAt: row.expiresAt,
          usedAt: row.usedAt,
        }
      : null,
    hash
  );
  if (!decision.ok) return decision;
  if (!row) return { ok: false, error: "This confirmation link is invalid." };

  try {
    await prisma.$transaction(async (tx) => {
      const member = await tx.member.findUnique({
        where: { id: decision.memberId },
        select: { id: true, deletedAt: true },
      });
      if (!member || member.deletedAt) {
        throw new Error("missing");
      }
      const other = await tx.member.findFirst({
        where: {
          email: decision.email,
          id: { not: decision.memberId },
          deletedAt: null,
        },
        select: { id: true },
      });
      if (other) throw new Error("taken");
      const claimed = await tx.emailVerificationToken.updateMany({
        where: { id: row.id, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() },
      });
      if (claimed.count !== 1) throw new Error("used");
      await tx.member.update({
        where: { id: decision.memberId },
        data: {
          email: decision.email,
          emailVerifiedAt: new Date().toISOString(),
        },
      });
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "taken") {
      return { ok: false, error: "That email is already used on another account." };
    }
    if (message === "used") {
      return { ok: false, error: "This confirmation link was already used." };
    }
    return { ok: false, error: "This confirmation link is invalid." };
  }

  return { ok: true, email: decision.email };
}
