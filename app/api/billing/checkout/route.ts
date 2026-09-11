import { NextResponse } from "next/server";
import { publicError } from "@/lib/safeError";
import Stripe from "stripe";
import { BLACK_MONTHLY_USD, BLACK_YEARLY_USD } from "@/lib/black";
import { getCurrentMember } from "@/lib/memberAuth";
import { rateLimit } from "@/lib/rateLimit";
import { appUrl, hasRecentReauth } from "@/lib/session";
import { billingCheckoutSchema } from "@/lib/validation/black";
import { parseBody } from "@/lib/validation/parse";

function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-07-29.dahlia" });
}

/** Create a Stripe Checkout session. Amounts for BLACK are server-fixed. */
export async function POST(req: Request) {
  const limited = rateLimit(req, { name: "billing", limit: 20, windowMs: 60_000 });
  if (!limited.ok) return limited.response;

  const stripe = stripeClient();
  if (!stripe) {
    return NextResponse.json({
      ok: true,
      stripeConfigured: false,
      message: "Add STRIPE_SECRET_KEY to enable real checkout.",
    });
  }

  const me = await getCurrentMember();
  if (!me) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

  if (me.passwordHash && !(await hasRecentReauth(me.id))) {
    return NextResponse.json(
      { ok: false, error: "Confirm your password to continue.", needsReauth: true },
      { status: 401 }
    );
  }

  const parsed = await parseBody(req, billingCheckoutSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const kind = body.kind || "black_month";
  let amount = BLACK_MONTHLY_USD * 100;
  let name = "Interlink BLACK · Monthly";
  if (kind === "premier_year") {
    amount = 10000;
    name = "Interlink Premier · Yearly";
  } else if (kind === "premier_month") {
    amount = 2000;
    name = "Interlink Premier · Monthly";
  } else if (kind === "black_year") {
    amount = BLACK_YEARLY_USD * 100;
    name = "Interlink BLACK · Yearly";
  } else if (kind === "black_month") {
    amount = BLACK_MONTHLY_USD * 100;
    name = "Interlink BLACK · Monthly";
  } else if (kind === "booking") {
    // Cap booking fee — ignore inflated client amounts
    const requested = Math.round((body.amountUsd || 5) * 100);
    amount = Math.min(Math.max(requested, 100), 5000);
    name = body.label || "Interlink table booking";
  }

  const chatId = body.chatId?.trim();
  const successPath =
    kind === "booking" && chatId
      ? `/chats?c=${encodeURIComponent(chatId)}&paid=1`
      : kind.startsWith("black")
        ? "/profile?black=success"
        : "/profile?billing=success";
  const cancelPath =
    kind === "booking" && chatId
      ? `/chats?c=${encodeURIComponent(chatId)}`
      : kind.startsWith("black")
        ? "/profile?black=cancel"
        : "/profile?billing=cancel";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: kind === "booking" ? "payment" : "subscription",
      customer_email: me.email || undefined,
      line_items:
        kind === "booking"
          ? [
              {
                quantity: 1,
                price_data: {
                  currency: "usd",
                  unit_amount: amount,
                  product_data: { name },
                },
              },
            ]
          : [
              {
                quantity: 1,
                price_data: {
                  currency: "usd",
                  unit_amount: amount,
                  recurring: { interval: kind.endsWith("year") ? "year" : "month" },
                  product_data: { name },
                },
              },
            ],
      success_url: appUrl(`${successPath}`),
      cancel_url: appUrl(`${cancelPath}`),
      metadata: {
        kind,
        memberId: me.id,
        chatId: chatId || "",
        meetupAt: body.meetupAt || "",
        phone: body.phone || "",
      },
    });

    return NextResponse.json({
      ok: true,
      stripeConfigured: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (e) {
    return publicError(e, "Checkout failed");
  }
}
