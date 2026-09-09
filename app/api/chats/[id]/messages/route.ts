import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/memberAuth";
import { purgeDemoResidue } from "@/lib/purgeDemo";
import { rateLimit } from "@/lib/rateLimit";
import { parseBody } from "@/lib/validation/parse";
import { chatMessageSchema } from "@/lib/validation/safety";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await purgeDemoResidue();
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
    const limited = rateLimit(req, { name: "chat-msg", limit: 90, windowMs: 60_000 });
    if (!limited.ok) return limited.response;

    await purgeDemoResidue();
    const me = await getCurrentMember();
    if (!me) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const { id } = await ctx.params;

    const parsed = await parseBody(req, chatMessageSchema);
    if (!parsed.ok) return parsed.response;

    const membership = await prisma.chatMember.findUnique({
      where: { chatId_memberId: { chatId: id, memberId: me.id } },
    });
    if (!membership) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    const text = parsed.data.text;
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
