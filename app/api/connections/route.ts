import { NextResponse } from "next/server";
import { collapseConnections, planConnectionRequest } from "@/lib/connectionSync";
import { publicError } from "@/lib/safeError";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/memberAuth";
import { purgeDemoResidue } from "@/lib/purgeDemo";
import { rateLimit } from "@/lib/rateLimit";
import type { Connection as ClientConnection } from "@/lib/types";
import {
  connectionPatchSchema,
  connectionPostSchema,
} from "@/lib/validation/safety";
import { parseBody } from "@/lib/validation/parse";

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
    await purgeDemoResidue();
    const me = await getCurrentMember();
    if (!me) return NextResponse.json({ ok: true, connections: [] as ClientConnection[] });

    const rows = await prisma.connection.findMany({
      where: { OR: [{ fromId: me.id }, { toId: me.id }] },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      ok: true,
      connections: collapseConnections(rows.map((r) => toClient(r, me.id))),
    });
  } catch (e) {
    return publicError(e, "Failed");
  }
}

/** Request an introduction to peerId. An existing inbound request is accepted. */
export async function POST(req: Request) {
  try {
    const limited = rateLimit(req, { name: "connections-post", limit: 40, windowMs: 60_000 });
    if (!limited.ok) return limited.response;

    await purgeDemoResidue();
    const me = await getCurrentMember();
    if (!me) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

    const parsed = await parseBody(req, connectionPostSchema);
    if (!parsed.ok) return parsed.response;
    const { peerId } = parsed.data;

    if (peerId === me.id) {
      return NextResponse.json({ ok: false, error: "Invalid peer" }, { status: 400 });
    }

    const peer = await prisma.member.findUnique({ where: { id: peerId } });
    if (!peer) return NextResponse.json({ ok: false, error: "Peer not found" }, { status: 404 });

    const pair = await prisma.connection.findMany({
      where: {
        OR: [
          { fromId: me.id, toId: peerId },
          { fromId: peerId, toId: me.id },
        ],
      },
    });
    const plan = planConnectionRequest(pair, me.id, peerId);
    if (plan === "accept") {
      await prisma.connection.updateMany({
        where: { fromId: peerId, toId: me.id, status: "requested" },
        data: { status: "connected" },
      });
    } else if (plan === "request") {
      await prisma.connection.upsert({
        where: { fromId_toId: { fromId: me.id, toId: peerId } },
        create: { fromId: me.id, toId: peerId, status: "requested" },
        update: {},
      });
    }

    const rows = await prisma.connection.findMany({
      where: { OR: [{ fromId: me.id }, { toId: me.id }] },
    });

    return NextResponse.json({
      ok: true,
      connections: collapseConnections(rows.map((r) => toClient(r, me.id))),
    });
  } catch (e) {
    return publicError(e, "Failed");
  }
}

/** Accept / decline / remove. */
export async function PATCH(req: Request) {
  try {
    const limited = rateLimit(req, { name: "connections-patch", limit: 60, windowMs: 60_000 });
    if (!limited.ok) return limited.response;

    await purgeDemoResidue();
    const me = await getCurrentMember();
    if (!me) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

    const parsed = await parseBody(req, connectionPatchSchema);
    if (!parsed.ok) return parsed.response;
    const { peerId, action } = parsed.data;

    if (action === "accept") {
      await prisma.connection.updateMany({
        where: { fromId: peerId, toId: me.id, status: "requested" },
        data: { status: "connected" },
      });
    } else {
      await prisma.connection.deleteMany({
        where: {
          OR: [
            { fromId: me.id, toId: peerId },
            { fromId: peerId, toId: me.id },
          ],
        },
      });
    }

    const rows = await prisma.connection.findMany({
      where: { OR: [{ fromId: me.id }, { toId: me.id }] },
    });

    return NextResponse.json({
      ok: true,
      connections: collapseConnections(rows.map((r) => toClient(r, me.id))),
    });
  } catch (e) {
    return publicError(e, "Failed");
  }
}
