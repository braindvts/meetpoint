import { NextResponse } from "next/server";
import Stripe from "stripe";
import { publicError } from "@/lib/safeError";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/memberAuth";
import { legalConsentDenied } from "@/lib/legalGuard";
import { blackConnectionLevel } from "@/lib/black";
import {
  awardBlackConnection,
  blackConnectionCount,
  resolvePairing,
} from "@/lib/blackServer";
import { pairIsBlocked } from "@/lib/moderation";
import { purgeDemoResidue } from "@/lib/purgeDemo";
import { rateLimit } from "@/lib/rateLimit";
import { bookingChatId, paidBookingMatches } from "@/lib/stripeBooking";
import { blackMeetingSchema } from "@/lib/validation/black";
import { parseBody } from "@/lib/validation/parse";

function livePayments(): boolean {
  return process.env.NODE_ENV === "production" || !!process.env.VERCEL;
}

/**
 * A booked business meeting with a BLACK member can award BLACK CONNECTION.
 * It requires an accepted meeting invitation. On a live site it also requires
 * a paid Stripe booking session for this member and chat.
 */
export async function POST(req: Request) {
  try {
    const limited = await rateLimit(req, { name: "black-meeting", limit: 20, windowMs: 60_000 });
    if (!limited.ok) return limited.response;

    await purgeDemoResidue();
    const me = await getCurrentMember();
    if (!me) return NextResponse.json({ ok: false, error: "Sign in first" }, { status: 401 });
    const denied = legalConsentDenied(me);
    if (denied) return denied;

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
    if (!peer || peer.deletedAt) {
      return NextResponse.json({ ok: false, error: "Member not found" }, { status: 404 });
    }

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

    if (livePayments()) {
      const key = process.env.STRIPE_SECRET_KEY?.trim();
      const sessionId = parsed.data.sessionId?.trim();
      if (!key || !sessionId) {
        return NextResponse.json({
          ok: true,
          awarded: false,
          reason: "payment-not-confirmed",
        });
      }
      const stripe = new Stripe(key, { apiVersion: "2026-07-29.dahlia" });
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (!paidBookingMatches(session, me.id)) {
        return NextResponse.json({
          ok: true,
          awarded: false,
          reason: "payment-not-confirmed",
        });
      }
      const chatId = bookingChatId(session);
      const [mine, theirs] = await Promise.all([
        prisma.chatMember.findUnique({
          where: { chatId_memberId: { chatId, memberId: me.id } },
        }),
        prisma.chatMember.findUnique({
          where: { chatId_memberId: { chatId, memberId: peerId } },
        }),
      ]);
      if (!mine || !theirs) {
        return NextResponse.json({
          ok: true,
          awarded: false,
          reason: "payment-not-confirmed",
        });
      }
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
