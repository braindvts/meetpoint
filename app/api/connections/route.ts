import { NextResponse } from "next/server";
import { collapseConnections, planConnectionRequest } from "@/lib/connectionSync";
import { legalConsentDenied } from "@/lib/legalGuard";
import { canIntroduceToTier } from "@/lib/plans";
import { publicError } from "@/lib/safeError";
import { standingTier } from "@/lib/standing";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/memberAuth";
import { blockedPeerIdSet, pairIsBlocked } from "@/lib/moderation";
import { purgeDemoResidue } from "@/lib/purgeDemo";
import { accountKey, rateLimit } from "@/lib/rateLimit";
import { CONNECTIONS_POST_IP } from "@/lib/rateCaps";
import type { Connection as ClientConnection } from "@/lib/types";
import {
  connectionPatchSchema,
  connectionPostSchema,
} from "@/lib/validation/safety";
import { parseBody } from "@/lib/validation/parse";

async function visibleConnections(meId: string) {
  const [rows, blocked] = await Promise.all([
    prisma.connection.findMany({
      where: { OR: [{ fromId: meId }, { toId: meId }] },
      orderBy: { updatedAt: "desc" },
    }),
    blockedPeerIdSet(meId),
  ]);
  return collapseConnections(
    rows.map((r) => toClient(r, meId)).filter((c) => !blocked.has(c.peerId))
  );
}

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
    const denied = legalConsentDenied(me);
    if (denied) return denied;

    return NextResponse.json({
      ok: true,
      connections: await visibleConnections(me.id),
    });
  } catch (e) {
    return publicError(e, "Failed");
  }
}

/** Request an introduction to peerId. An existing inbound request is accepted. */
export async function POST(req: Request) {
  try {
    const limited = await rateLimit(req, CONNECTIONS_POST_IP);
    if (!limited.ok) return limited.response;

    await purgeDemoResidue();
    const me = await getCurrentMember();
    if (!me) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
    const denied = legalConsentDenied(me);
    if (denied) return denied;

    const accountLimited = await rateLimit(req, {
      name: "connections-post-acct",
      limit: 20,
      windowMs: 60 * 60_000,
      scope: "account",
      keyExtra: accountKey(me.id),
    });
    if (!accountLimited.ok) return accountLimited.response;

    const parsed = await parseBody(req, connectionPostSchema);
    if (!parsed.ok) return parsed.response;
    const { peerId } = parsed.data;

    if (peerId === me.id) {
      return NextResponse.json({ ok: false, error: "Invalid peer" }, { status: 400 });
    }

    const peer = await prisma.member.findUnique({ where: { id: peerId } });
    if (!peer || peer.deletedAt) {
      return NextResponse.json({ ok: false, error: "Peer not found" }, { status: 404 });
    }

    if (await pairIsBlocked(me.id, peerId)) {
      return NextResponse.json(
        { ok: false, error: "This member isn’t available." },
        { status: 403 }
      );
    }

    const pair = await prisma.connection.findMany({
      where: {
        OR: [
          { fromId: me.id, toId: peerId },
          { fromId: peerId, toId: me.id },
        ],
      },
    });
    const plan = planConnectionRequest(pair, me.id, peerId);
    if (plan === "request" && !canIntroduceToTier(standingTier(me), standingTier(peer))) {
      return NextResponse.json(
        { ok: false, error: "Become Verified to connect beyond Members." },
        { status: 403 }
      );
    }
    if (plan === "accept" && !canIntroduceToTier(standingTier(peer), standingTier(me))) {
      return NextResponse.json(
        { ok: false, error: "That introduction is outside your standing." },
        { status: 403 }
      );
    }
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

    return NextResponse.json({
      ok: true,
      connections: await visibleConnections(me.id),
    });
  } catch (e) {
    return publicError(e, "Failed");
  }
}

/** Accept / decline / remove. */
export async function PATCH(req: Request) {
  try {
    const limited = await rateLimit(req, { name: "connections-patch", limit: 60, windowMs: 60_000 });
    if (!limited.ok) return limited.response;

    await purgeDemoResidue();
    const me = await getCurrentMember();
    if (!me) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
    const denied = legalConsentDenied(me);
    if (denied) return denied;

    const parsed = await parseBody(req, connectionPatchSchema);
    if (!parsed.ok) return parsed.response;
    const { peerId, action } = parsed.data;

    if (await pairIsBlocked(me.id, peerId)) {
      return NextResponse.json(
        { ok: false, error: "This member isn’t available." },
        { status: 403 }
      );
    }

    if (action === "accept") {
      const peer = await prisma.member.findUnique({ where: { id: peerId } });
      if (!peer || peer.deletedAt) {
        return NextResponse.json({ ok: false, error: "Peer not found" }, { status: 404 });
      }
      if (!canIntroduceToTier(standingTier(peer), standingTier(me))) {
        return NextResponse.json(
          { ok: false, error: "That introduction is outside your standing." },
          { status: 403 }
        );
      }
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

    return NextResponse.json({
      ok: true,
      connections: await visibleConnections(me.id),
    });
  } catch (e) {
    return publicError(e, "Failed");
  }
}
