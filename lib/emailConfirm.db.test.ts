import assert from "node:assert/strict";
import { test } from "node:test";

test("confirmation link sets emailVerifiedAt once for that member and address", async (t) => {
  if (!process.env.DATABASE_URL) {
    t.skip("DATABASE_URL is not set");
    return;
  }

  const { prisma } = await import("./db");
  const { issueEmailConfirmation, consumeEmailConfirmation } = await import("./emailConfirmStore");
  const stamp = Date.now().toString(36);
  const member = await prisma.member.create({
    data: {
      email: `confirm-${stamp}@example.com`,
      name: "Confirm Me",
      passwordHash: "hash",
    },
  });

  try {
    const issued = await issueEmailConfirmation(member.id, `Next-${stamp}@Example.com`);
    const stored = await prisma.emailVerificationToken.findFirst({ where: { memberId: member.id } });
    assert.ok(stored);
    assert.notEqual(stored?.tokenHash, issued.raw);
    assert.equal(stored?.email, `next-${stamp}@example.com`);

    const first = await consumeEmailConfirmation(issued.raw);
    assert.equal(first.ok, true);
    const updated = await prisma.member.findUnique({ where: { id: member.id } });
    assert.equal(updated?.email, `next-${stamp}@example.com`);
    assert.ok(updated?.emailVerifiedAt);

    const second = await consumeEmailConfirmation(issued.raw);
    assert.equal(second.ok, false);
  } finally {
    await prisma.emailVerificationToken.deleteMany({ where: { memberId: member.id } });
    await prisma.member.delete({ where: { id: member.id } });
  }
});
