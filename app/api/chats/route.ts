import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/memberAuth";
import { purgeDemoResidue } from "@/lib/purgeDemo";
import { rateLimit } from "@/lib/rateLimit";
import { publicError } from "@/lib/safeError";
import { sanitizeText } from "@/lib/sanitize";
import { parseBody } from "@/lib/validation/parse";
import { chatCreateSchema } from "@/lib/validation/safety";

export async function GET() {
  try {
    await purgeDemoResidue();
    const me = await getCurrentMember();
    if (!me) return NextResponse.json({ ok: true, chats: [] });

    const memberships = await prisma.chatMember.findMany({
      where: { memberId: me.id },
      include: {
        chat: {
          include: {
            members: true,
            messages: { orderBy: { createdAt: "asc" }, take: 200 },
          },
        },
      },
      orderBy: { chat: { updatedAt: "desc" } },
    });

    const chats = memberships.map((m) => {
      const c = m.chat;
      return {
        id: c.id,
        name: c.name,
        memberIds: c.members.filter((x) => x.memberId !== me.id).map((x) => x.memberId),
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        messages: c.messages.map((msg) => ({
          id: msg.id,
          senderId: msg.senderId === me.id ? "me" : msg.senderId,
          text: msg.text,
          createdAt: msg.createdAt.toISOString(),
        })),
      };
    });

    return NextResponse.json({ ok: true, chats, meId: me.id });
  } catch (e) {
    return publicError(e, "Failed to load chats");
  }
}

export async function POST(req: Request) {
  try {
    const limited = rateLimit(req, { name: "chat-create", limit: 30, windowMs: 60_000 });
    if (!limited.ok) return limited.response;

    await purgeDemoResidue();
    const me = await getCurrentMember();
    if (!me) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

    const parsed = await parseBody(req, chatCreateSchema);
    if (!parsed.ok) return parsed.response;

    const peerIds = [...new Set((parsed.data.memberIds || []).filter((id) => id && id !== me.id))];
    if (!peerIds.length) {
      return NextResponse.json({ ok: false, error: "Need members" }, { status: 400 });
    }

    // Only allow chatting with accepted connections (prevents IDOR spam chats)
    for (const peerId of peerIds) {
      const connection = await prisma.connection.findFirst({
        where: {
          status: "connected",
          OR: [
            { fromId: me.id, toId: peerId },
            { fromId: peerId, toId: me.id },
          ],
        },
      });
      if (!connection) {
        return NextResponse.json(
          { ok: false, error: "You can only chat with connected members." },
          { status: 403 }
        );
      }
    }

    const chat = await prisma.chat.create({
      data: {
        name: sanitizeText(parsed.data.name || "Private", 80) || "Private",
        members: {
          create: [{ memberId: me.id }, ...peerIds.map((id) => ({ memberId: id }))],
        },
      },
      include: { members: true, messages: true },
    });

    return NextResponse.json({
      ok: true,
      chat: {
        id: chat.id,
        name: chat.name,
        memberIds: peerIds,
        messages: [],
        createdAt: chat.createdAt.toISOString(),
        updatedAt: chat.updatedAt.toISOString(),
      },
    });
  } catch (e) {
    return publicError(e, "Failed to create chat");
  }
}
