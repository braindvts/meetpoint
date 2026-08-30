import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/memberAuth";
import { purgeDemoResidue } from "@/lib/purgeDemo";

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
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await purgeDemoResidue();
    const me = await getCurrentMember();
    if (!me) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

    const body = (await req.json()) as { name?: string; memberIds?: string[] };
    const peerIds = (body.memberIds || []).filter((id) => id && id !== me.id);
    if (!peerIds.length) {
      return NextResponse.json({ ok: false, error: "Need members" }, { status: 400 });
    }

    const chat = await prisma.chat.create({
      data: {
        name: body.name || "Private",
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
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
