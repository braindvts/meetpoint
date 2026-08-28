import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/memberAuth";
import { ensureSeeded } from "@/lib/seed";

export async function GET() {
  try {
    await ensureSeeded();
    const me = await getCurrentMember();
    if (!me) return NextResponse.json({ ok: true, blockedIds: [] });

    const rows = await prisma.block.findMany({
      where: { blockerId: me.id },
      select: { blockedId: true },
    });
    return NextResponse.json({
      ok: true,
      blockedIds: rows.map((r) => r.blockedId),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await ensureSeeded();
    const me = await getCurrentMember();
    if (!me) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = (await req.json()) as { peerId?: string; action?: "block" | "unblock" };
    const peerId = String(body.peerId || "").trim();
    if (!peerId || peerId === me.id) {
      return NextResponse.json({ ok: false, error: "Invalid peer" }, { status: 400 });
    }

    if (body.action === "unblock") {
      await prisma.block.deleteMany({ where: { blockerId: me.id, blockedId: peerId } });
    } else {
      await prisma.block.upsert({
        where: { blockerId_blockedId: { blockerId: me.id, blockedId: peerId } },
        create: { blockerId: me.id, blockedId: peerId },
        update: {},
      });
      await prisma.connection.deleteMany({
        where: {
          OR: [
            { fromId: me.id, toId: peerId },
            { fromId: peerId, toId: me.id },
          ],
        },
      });
    }

    const rows = await prisma.block.findMany({
      where: { blockerId: me.id },
      select: { blockedId: true },
    });
    return NextResponse.json({ ok: true, blockedIds: rows.map((r) => r.blockedId) });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
