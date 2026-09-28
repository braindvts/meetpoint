import assert from "node:assert/strict";
import { test } from "node:test";
import { anonymizeDeletedAccount } from "./accountDeletion";

test("deletion transaction anonymizes personal data and keeps the report", async (t) => {
  if (!process.env.DATABASE_URL) {
    t.skip("DATABASE_URL is not set");
    return;
  }

  const { prisma } = await import("./db");
  const stamp = Date.now().toString(36);
  const member = await prisma.member.create({
    data: {
      email: `delete-${stamp}@example.com`,
      name: "Delete Me",
      phone: "+15555550123",
      bio: "secret bio",
      company: "Secret Co",
      industry: "Finance",
      passwordHash: "hash",
      googleId: `g-${stamp}`,
    },
  });
  const peer = await prisma.member.create({
    data: { email: `peer-${stamp}@example.com`, name: "Peer" },
  });
  const chat = await prisma.chat.create({
    data: {
      name: "dm",
      members: { create: [{ memberId: member.id }, { memberId: peer.id }] },
      messages: { create: [{ senderId: member.id, text: "private note" }] },
    },
  });
  await prisma.connection.create({
    data: { fromId: member.id, toId: peer.id, status: "connected" },
  });
  const reported = await prisma.report.create({
    data: { reporterId: peer.id, peerId: member.id, reason: "kept for safety", category: "fraud" },
  });
  const filed = await prisma.report.create({
    data: { reporterId: member.id, peerId: peer.id, reason: "member filed this", category: "harassment" },
  });
  const blockedThem = await prisma.block.create({
    data: { blockerId: member.id, blockedId: peer.id },
  });
  const blockedUs = await prisma.block.create({
    data: { blockerId: peer.id, blockedId: member.id },
  });

  try {
    await prisma.$transaction((tx) => anonymizeDeletedAccount(tx, member.id));

    const stored = await prisma.member.findUnique({ where: { id: member.id } });
    assert.ok(stored);
    assert.equal(stored.email, null);
    assert.equal(stored.phone, null);
    assert.equal(stored.bio, "");
    assert.equal(stored.googleId, null);
    assert.equal(stored.passwordHash, null);
    assert.equal(stored.name, "Deleted member");
    assert.equal(stored.company, "");
    assert.equal(stored.industry, "");
    assert.ok(stored.deletedAt);

    const message = await prisma.message.findFirst({ where: { chatId: chat.id, senderId: member.id } });
    assert.equal(message?.text, "");
    const kept = await prisma.report.findUnique({ where: { id: reported.id } });
    assert.equal(kept?.reason, "kept for safety");
    assert.equal(kept?.category, "fraud");
    assert.equal(kept?.peerId, member.id);
    const filedRow = await prisma.report.findUnique({ where: { id: filed.id } });
    assert.equal(filedRow?.reason, "member filed this");
    assert.equal(filedRow?.reporterId, member.id);
    const blocks = await prisma.block.findMany({
      where: { id: { in: [blockedThem.id, blockedUs.id] } },
    });
    assert.equal(blocks.length, 2);
    let memberDeleteBlocked = false;
    try {
      await prisma.member.delete({ where: { id: member.id } });
    } catch {
      memberDeleteBlocked = true;
    }
    assert.equal(memberDeleteBlocked, true);
    const links = await prisma.connection.count({
      where: { OR: [{ fromId: member.id }, { toId: member.id }] },
    });
    assert.equal(links, 0);
  } finally {
    await prisma.report.deleteMany({ where: { id: { in: [reported.id, filed.id] } } });
    await prisma.block.deleteMany({ where: { id: { in: [blockedThem.id, blockedUs.id] } } });
    await prisma.message.deleteMany({ where: { chatId: chat.id } });
    await prisma.chatMember.deleteMany({ where: { chatId: chat.id } });
    await prisma.chat.deleteMany({ where: { id: chat.id } });
    await prisma.connection.deleteMany({
      where: { OR: [{ fromId: peer.id }, { toId: peer.id }, { fromId: member.id }, { toId: member.id }] },
    });
    await prisma.member.deleteMany({ where: { id: { in: [member.id, peer.id] } } });
    await prisma.$disconnect();
  }
});
