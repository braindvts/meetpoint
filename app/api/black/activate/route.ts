import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getCurrentMember } from "@/lib/memberAuth";
import { memberToProfile } from "@/lib/memberMap";
import {
  isVerified,
  memberQualifiesForEarnedBlack,
  setBlack,
} from "@/lib/blackServer";
import { purgeDemoResidue } from "@/lib/purgeDemo";

/**
 * Become BLACK — by paying or by qualifying. Two rules hold in both cases:
 * verification is never skipped, and the client never decides the outcome.
 *
 *   { source: "earned" }              → the server re-checks the requirements
 *   { source: "paid", sessionId }     → the server confirms the Stripe payment
 */
export async function POST(req: Request) {
  try {
    await purgeDemoResidue();
    const me = await getCurrentMember();
    if (!me) return NextResponse.json({ ok: false, error: "Sign in first" }, { status: 401 });

    // Paying does not buy a way around verification.
    if (!isVerified(me)) {
      return NextResponse.json(
        { ok: false, error: "Verify your profile before BLACK can be activated.", needsVerification: true },
        { status: 403 }
      );
    }

    const body = (await req.json()) as { source?: string; sessionId?: string };
    const source = body.source === "paid" ? "paid" : "earned";

    if (source === "earned") {
      if (!memberQualifiesForEarnedBlack(me)) {
        return NextResponse.json(
          { ok: false, error: "You haven't reached the requirements for earned BLACK yet." },
          { status: 403 }
        );
      }
      const updated = await setBlack(me.id, "earned");
      return NextResponse.json({ ok: true, black: true, source: "earned", profile: memberToProfile(updated) });
    }

    const key = process.env.STRIPE_SECRET_KEY?.trim();
    if (key) {
      const sessionId = String(body.sessionId || "").trim();
      if (!sessionId) {
        return NextResponse.json(
          { ok: false, error: "Missing checkout session" },
          { status: 400 }
        );
      }
      const stripe = new Stripe(key, { apiVersion: "2026-07-29.dahlia" });
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const paid = session.payment_status === "paid" || session.status === "complete";
      const kind = String(session.metadata?.kind || "");
      const boughtBy = String(session.metadata?.memberId || "");

      if (!paid || !kind.startsWith("black") || boughtBy !== me.id) {
        return NextResponse.json(
          { ok: false, error: "That payment could not be verified." },
          { status: 402 }
        );
      }
    } else if (process.env.NODE_ENV === "production") {
      // No Stripe key in production means no verifiable purchase, so no BLACK.
      return NextResponse.json(
        { ok: false, error: "Payments are not configured, so BLACK cannot be purchased." },
        { status: 503 }
      );
    }

    const updated = await setBlack(me.id, "paid");
    return NextResponse.json({
      ok: true,
      black: true,
      source: "paid",
      stripeVerified: !!key,
      profile: memberToProfile(updated),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
