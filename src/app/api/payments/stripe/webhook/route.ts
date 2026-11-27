import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  handleAsyncFailure,
  handleDispute,
  handleRefund,
  handleSessionExpired,
  recordFailedAttempt,
  syncCheckoutSession,
} from "@/lib/payments/service";
import { hasHandledEvent, recordEvent, type Payment } from "@/lib/payments/store";
import { stripe, webhookSecret } from "@/lib/payments/stripe";

async function handle(event: Stripe.Event): Promise<Payment | null> {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      return syncCheckoutSession(event.data.object);
    case "checkout.session.async_payment_failed":
      return handleAsyncFailure(event.data.object);
    case "checkout.session.expired":
      return handleSessionExpired(event.data.object);
    case "payment_intent.payment_failed":
      return recordFailedAttempt(event.data.object);
    case "charge.refunded":
      return handleRefund(event.data.object);
    case "charge.dispute.created":
      return handleDispute(event.data.object);
    default:
      return null;
  }
}

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = await stripe().webhooks.constructEventAsync(await req.text(), signature, webhookSecret());
  } catch (e) {
    console.error("[stripe] webhook signature rejected", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (await hasHandledEvent(event.id)) return NextResponse.json({ received: true, duplicate: true });
    const payment = await handle(event);
    await recordEvent(event.id, event.type, payment?.id ?? null);
    return NextResponse.json({ received: true });
  } catch (e) {
    // A 500 makes Stripe retry later. Every handler is safe to run again.
    console.error("[stripe] webhook failed", event.type, event.id, e);
    return NextResponse.json({ error: "Webhook handling failed" }, { status: 500 });
  }
}
