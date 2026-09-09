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
import { rateLimit } from "@/lib/rateLimit";
import { hasRecentReauth } from "@/lib/session";
import { blackActivateSchema } from "@/lib/validation/black";
import { parseBody } from "@/lib/validation/parse";

/**
 * Become BLACK — by paying or by qualifying.
 * Paid path requires recent re-auth + verified Stripe session when configured.
 */
export async function POST(req: Request) {
  try {
    const limited = rateLimit(req, { name: "black-activate", limit: 15, windowMs: 60_000 });
    if (!limited.ok) return limited.response;

    await purgeDemoResidue();
    const me = await getCurrentMember();
    if (!me) return NextResponse.json({ ok: false, error: "Sign in first" }, { status: 401 });

    if (!isVerified(me)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Verify your profile before BLACK can be activated.",
          needsVerification: true,
        },
        { status: 403 }
      );
    }

    const parsed = await parseBody(req, blackActivateSchema);
    if (!parsed.ok) return parsed.response;

    const source = parsed.data.source === "paid" ? "paid" : "earned";

    if (source === "earned") {
      if (!memberQualifiesForEarnedBlack(me)) {
        return NextResponse.json(
          { ok: false, error: "You haven't reached the requirements for earned BLACK yet." },
          { status: 403 }
        );
      }
      const updated = await setBlack(me.id, "earned");
      return NextResponse.json({
        ok: true,
        black: true,
        source: "earned",
        profile: memberToProfile(updated),
      });
    }

    // Paid BLACK — step-up reauth when the account has a password
    if (me.passwordHash && !(await hasRecentReauth(me.id))) {
      return NextResponse.json(
        {
          ok: false,
          error: "Confirm your password to continue.",
          needsReauth: true,
        },
        { status: 401 }
      );
    }

    const key = process.env.STRIPE_SECRET_KEY?.trim();
    if (key) {
      const sessionId = String(parsed.data.sessionId || "").trim();
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
    } else {
      // Never grant paid BLACK without Stripe in any environment that looks live
      if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
        return NextResponse.json(
          { ok: false, error: "Payments are not configured, so BLACK cannot be purchased." },
          { status: 503 }
        );
      }
    }

    const updated = await setBlack(me.id, "paid");
    return NextResponse.json({
      ok: true,
      black: true,
      source: "paid",
      profile: memberToProfile(updated),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
