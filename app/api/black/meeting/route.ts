import { NextResponse } from "next/server";
import { publicError } from "@/lib/safeError";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/memberAuth";
import { blackConnectionLevel } from "@/lib/black";
import {
  awardBlackConnection,
  blackConnectionCount,
  resolvePairing,
} from "@/lib/blackServer";
import { pairIsBlocked } from "@/lib/moderation";
import { purgeDemoResidue } from "@/lib/purgeDemo";
import { rateLimit } from "@/lib/rateLimit";
import { blackMeetingSchema } from "@/lib/validation/black";
import { parseBody } from "@/lib/validation/parse";

/**
 * A booked business meeting with a BLACK member is the second way to reach
 * BLACK CONNECTION. It requires an accepted meeting invitation between the two
 * of them — a table alone, or a declined request, awards nothing.
 */
export async function POST(req: Request) {
  try {
    const limited = await rateLimit(req, { name: "black-meeting", limit: 20, windowMs: 60_000 });
    if (!limited.ok) return limited.response;

    await purgeDemoResidue();
    const me = await getCurrentMember();
    if (!me) return NextResponse.json({ ok: false, error: "Sign in first" }, { status: 401 });

    const parsed = await parseBody(req, blackMeetingSchema);
    if (!parsed.ok) return parsed.response;
    const peerId = parsed.data.peerId;
    if (peerId === me.id) {
      return NextResponse.json({ ok: false, error: "peerId required" }, { status: 400 });
    }
    if (await pairIsBlocked(me.id, peerId)) {
      return NextResponse.json(
        { ok: false, error: "This member isn’t available." },
        { status: 403 }
      );
    }

    const peer = await prisma.member.findUnique({ where: { id: peerId } });
    if (!peer) return NextResponse.json({ ok: false, error: "Member not found" }, { status: 404 });

    const pairing = resolvePairing(me, peer);
    if (!pairing) {
      return NextResponse.json({ ok: true, awarded: false, reason: "not-a-black-pairing" });
    }

    const accepted = await prisma.blackInvite.findFirst({
      where: {
        kind: "meeting",
        status: "accepted",
        OR: [
          { fromId: me.id, toId: peerId },
          { fromId: peerId, toId: me.id },
        ],
      },
    });
    if (!accepted) {
      return NextResponse.json({
        ok: true,
        awarded: false,
        reason: "no-accepted-meeting-request",
      });
    }

    const { created } = await awardBlackConnection(pairing, "meeting");
    const count = await blackConnectionCount(pairing.peerId);

    return NextResponse.json({
      ok: true,
      awarded: created,
      recipientBecameBlack: false,
      blackConnectionHolder: pairing.peerId,
      blackConnections: blackConnectionLevel(count),
    });
  } catch (e) {
    return publicError(e, "Failed");
  }
}
