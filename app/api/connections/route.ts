import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/memberAuth";
import { ensureSeeded } from "@/lib/seed";
import type { Connection as ClientConnection } from "@/lib/types";

function toClient(
  row: { id: string; fromId: string; toId: string; status: string; meetupJson: string | null },
  meId: string
): ClientConnection {
  const inbound = row.toId === meId;
  return {
    peerId: inbound ? row.fromId : row.toId,
    status: row.status as "requested" | "connected",
    direction: inbound ? "in" : "out",
    meetup: row.meetupJson ? (JSON.parse(row.meetupJson) as ClientConnection["meetup"]) : undefined,
  };
}

export async function GET() {
  try {
    await ensureSeeded();
    const me = await getCurrentMember();
    if (!me) return NextResponse.json({ ok: true, connections: [] as ClientConnection[] });

    const rows = await prisma.connection.findMany({
      where: { OR: [{ fromId: me.id }, { toId: me.id }] },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      ok: true,
      connections: rows.map((r) => toClient(r, me.id)),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}

/** Request an introduction to peerId. */
export async function POST(req: Request) {
  try {
    await ensureSeeded();
    const me = await getCurrentMember();
    if (!me) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

    const { peerId } = (await req.json()) as { peerId?: string };
    if (!peerId) return NextResponse.json({ ok: false, error: "Missing peerId" }, { status: 400 });
    if (peerId === me.id) {
      return NextResponse.json({ ok: false, error: "Invalid peer" }, { status: 400 });
    }

    const peer = await prisma.member.findUnique({ where: { id: peerId } });
    if (!peer) return NextResponse.json({ ok: false, error: "Peer not found" }, { status: 404 });

    await prisma.connection.upsert({
      where: { fromId_toId: { fromId: me.id, toId: peerId } },
      create: { fromId: me.id, toId: peerId, status: "requested" },
      update: {},
    });

    const rows = await prisma.connection.findMany({
      where: { OR: [{ fromId: me.id }, { toId: me.id }] },
    });

    return NextResponse.json({
      ok: true,
      connections: rows.map((r) => toClient(r, me.id)),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}

/** Accept / decline / remove. */
export async function PATCH(req: Request) {
  try {
    await ensureSeeded();
    const me = await getCurrentMember();
    if (!me) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

    const body = (await req.json()) as {
      peerId?: string;
      action?: "accept" | "decline" | "remove";
    };
    if (!body.peerId || !body.action) {
      return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
    }

    if (body.action === "accept") {
      await prisma.connection.updateMany({
        where: { fromId: body.peerId, toId: me.id, status: "requested" },
        data: { status: "connected" },
      });
    } else {
      await prisma.connection.deleteMany({
        where: {
          OR: [
            { fromId: me.id, toId: body.peerId },
            { fromId: body.peerId, toId: me.id },
          ],
        },
      });
    }

    const rows = await prisma.connection.findMany({
      where: { OR: [{ fromId: me.id }, { toId: me.id }] },
    });

    return NextResponse.json({
      ok: true,
      connections: rows.map((r) => toClient(r, me.id)),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
