import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getCurrentMember } from "@/lib/memberAuth";
import { appUrl } from "@/lib/session";

function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-07-29.dahlia" });
}

export function stripeConfigured() {
  return !!process.env.STRIPE_SECRET_KEY?.trim();
}

/**
 * Create a Stripe Checkout session for Premier or a table booking fee.
 * Without STRIPE_SECRET_KEY → { demo: true } so the UI can fall back.
 */
export async function POST(req: Request) {
  const stripe = stripeClient();
  if (!stripe) {
    return NextResponse.json({
      ok: true,
      demo: true,
      message: "Add STRIPE_SECRET_KEY to enable real checkout.",
    });
  }

  const me = await getCurrentMember();
  if (!me) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

  const body = (await req.json()) as {
    kind?: "premier_month" | "premier_year" | "booking";
    amountUsd?: number;
    label?: string;
    chatId?: string;
    meetupAt?: string;
    phone?: string;
  };

  const kind = body.kind || "premier_month";
  let amount = 2000;
  let name = "Conclave Premier · Monthly";
  if (kind === "premier_year") {
    amount = 10000;
    name = "Conclave Premier · Yearly";
  } else if (kind === "booking") {
    amount = Math.round((body.amountUsd || 5) * 100);
    name = body.label || "Conclave table booking";
  }

  const chatId = body.chatId?.trim();
  const successPath =
    kind === "booking" && chatId
      ? `/chats/${encodeURIComponent(chatId)}?paid=1`
      : "/profile?billing=success";
  const cancelPath =
    kind === "booking" && chatId
      ? `/chats/${encodeURIComponent(chatId)}?paid=cancel`
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
                  recurring: { interval: kind === "premier_year" ? "year" : "month" },
                  product_data: { name },
                },
              },
            ],
      success_url: appUrl(successPath),
      cancel_url: appUrl(cancelPath),
      metadata: {
        memberId: me.id,
        kind,
        chatId: chatId || "",
        meetupAt: body.meetupAt || "",
        phone: body.phone || "",
      },
    });

    return NextResponse.json({ ok: true, demo: false, url: session.url });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Stripe failed" },
      { status: 502 }
    );
  }
}
