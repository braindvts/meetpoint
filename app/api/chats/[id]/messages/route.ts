import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/memberAuth";
import { purgeLegacySeedMembers } from "@/lib/legacySeed";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await purgeLegacySeedMembers();
    const me = await getCurrentMember();
    if (!me) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const { id } = await ctx.params;

    const membership = await prisma.chatMember.findUnique({
      where: { chatId_memberId: { chatId: id, memberId: me.id } },
    });
    if (!membership) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    const since = new URL(_req.url).searchParams.get("since");
    const messages = await prisma.message.findMany({
      where: {
        chatId: id,
        ...(since ? { createdAt: { gt: new Date(since) } } : {}),
      },
      orderBy: { createdAt: "asc" },
      take: 300,
    });

    return NextResponse.json({
      ok: true,
      messages: messages.map((msg) => ({
        id: msg.id,
        senderId: msg.senderId === me.id ? "me" : msg.senderId,
        text: msg.text,
        createdAt: msg.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await purgeLegacySeedMembers();
    const me = await getCurrentMember();
    if (!me) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const { id } = await ctx.params;
    const body = (await req.json()) as { text?: string };

    const membership = await prisma.chatMember.findUnique({
      where: { chatId_memberId: { chatId: id, memberId: me.id } },
    });
    if (!membership) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    const text = String(body.text || "").trim().slice(0, 4000);
    if (!text) return NextResponse.json({ ok: false, error: "Empty" }, { status: 400 });

    const msg = await prisma.message.create({
      data: { chatId: id, senderId: me.id, text },
    });
    await prisma.chat.update({ where: { id }, data: { updatedAt: new Date() } });

    return NextResponse.json({
      ok: true,
      message: {
        id: msg.id,
        senderId: "me",
        text: msg.text,
        createdAt: msg.createdAt.toISOString(),
      },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
