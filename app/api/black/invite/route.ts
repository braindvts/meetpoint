import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/memberAuth";
import { blackConnectionLevel } from "@/lib/black";
import {
  awardBlackConnection,
  blackConnectionCount,
  resolvePairing,
} from "@/lib/blackServer";
import { purgeDemoResidue } from "@/lib/purgeDemo";

/**
 * BLACK invitations. Raised inside a private DM, for a private connection or a
 * business meeting — never for ordinary public networking.
 *
 * Accepting one awards BLACK CONNECTION to the member who isn't BLACK. It never
 * awards BLACK, in either direction.
 */

const KINDS = ["connection", "meeting"] as const;
type Kind = (typeof KINDS)[number];

export async function POST(req: Request) {
  try {
    await purgeDemoResidue();
    const me = await getCurrentMember();
    if (!me) return NextResponse.json({ ok: false, error: "Sign in first" }, { status: 401 });

    const body = (await req.json()) as { peerId?: string; chatId?: string; kind?: string };
    const peerId = String(body.peerId || "").trim();
    const kind: Kind = body.kind === "meeting" ? "meeting" : "connection";

    if (!peerId) {
      return NextResponse.json({ ok: false, error: "peerId required" }, { status: 400 });
    }
    if (peerId === me.id) {
      return NextResponse.json(
        { ok: false, error: "You can't invite yourself." },
        { status: 400 }
      );
    }

    const peer = await prisma.member.findUnique({ where: { id: peerId } });
    if (!peer) return NextResponse.json({ ok: false, error: "Member not found" }, { status: 404 });

    // Exactly one side must be BLACK for this to mean anything.
    const pairing = resolvePairing(me, peer);
    if (!pairing) {
      return NextResponse.json(
        {
          ok: false,
          error: me.black
            ? "They are already BLACK — no invitation needed."
            : "BLACK invitations only apply to a BLACK member.",
        },
        { status: 403 }
      );
    }

    // The pairing must already be connected, so this can't arrive out of nowhere.
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
        { ok: false, error: "Connect and speak privately first." },
        { status: 403 }
      );
    }

    const existingConnection = await prisma.blackConnection.findUnique({
      where: {
        blackMemberId_peerId: { blackMemberId: pairing.blackMemberId, peerId: pairing.peerId },
      },
    });
    if (existingConnection) {
      return NextResponse.json(
        { ok: false, error: "You already hold a BLACK connection with them." },
        { status: 409 }
      );
    }

    const invite = await prisma.blackInvite.upsert({
      where: { fromId_toId_kind: { fromId: me.id, toId: peerId, kind } },
      create: {
        fromId: me.id,
        toId: peerId,
        chatId: body.chatId ? String(body.chatId) : null,
        kind,
        status: "pending",
      },
      update: { status: "pending", respondedAt: null, chatId: body.chatId ? String(body.chatId) : null },
    });

    return NextResponse.json({
      ok: true,
      invite: {
        id: invite.id,
        kind: invite.kind,
        status: invite.status,
        direction: "out",
        peerId,
        chatId: invite.chatId,
        createdAt: invite.createdAt,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}

/** Accept or decline. Only the recipient may respond, and only once. */
export async function PATCH(req: Request) {
  try {
    const me = await getCurrentMember();
    if (!me) return NextResponse.json({ ok: false, error: "Sign in first" }, { status: 401 });

    const body = (await req.json()) as { inviteId?: string; action?: string };
    const inviteId = String(body.inviteId || "").trim();
    const action = body.action === "accept" ? "accept" : "decline";

    const invite = await prisma.blackInvite.findUnique({ where: { id: inviteId } });
    if (!invite) return NextResponse.json({ ok: false, error: "Invite not found" }, { status: 404 });

    if (invite.toId !== me.id) {
      return NextResponse.json(
        { ok: false, error: "Only the person invited can answer this." },
        { status: 403 }
      );
    }
    if (invite.status !== "pending") {
      return NextResponse.json(
        { ok: false, error: `This invitation was already ${invite.status}.` },
        { status: 409 }
      );
    }

    if (action === "decline") {
      await prisma.blackInvite.update({
        where: { id: invite.id },
        data: { status: "declined", respondedAt: new Date() },
      });
      return NextResponse.json({ ok: true, status: "declined", awarded: false });
    }

    const sender = await prisma.member.findUnique({ where: { id: invite.fromId } });
    if (!sender) return NextResponse.json({ ok: false, error: "Member not found" }, { status: 404 });

    const pairing = resolvePairing(sender, me);
    if (!pairing) {
      return NextResponse.json(
        { ok: false, error: "This pairing no longer qualifies for a BLACK connection." },
        { status: 403 }
      );
    }

    await prisma.blackInvite.update({
      where: { id: invite.id },
      data: { status: "accepted", respondedAt: new Date() },
    });

    // A meeting invitation is only an agreement to meet; the credential lands
    // once the table is actually booked.
    if (invite.kind === "meeting") {
      return NextResponse.json({
        ok: true,
        status: "accepted",
        awarded: false,
        awaitingMeeting: true,
      });
    }

    const { created } = await awardBlackConnection(pairing, "invite");
    const count = await blackConnectionCount(pairing.peerId);

    return NextResponse.json({
      ok: true,
      status: "accepted",
      awarded: created,
      // Spelled out because it is the whole point: no one becomes BLACK here.
      recipientBecameBlack: false,
      blackConnectionHolder: pairing.peerId,
      blackConnections: blackConnectionLevel(count),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
