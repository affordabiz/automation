import "server-only";
import { revalidateTag } from "next/cache";
import type Stripe from "stripe";
import { recordAudit } from "@/lib/admin/audit";
import { sendEmail } from "@/lib/brevo";
import { adminPaymentEmail, paymentFailedEmail, paymentReceivedEmail, type AdminPaymentAlert } from "@/lib/emails/payments";
import { siteBase } from "@/lib/siteUrl";
import { serviceClient } from "@/lib/supabase/service";
import { formatMoney, PRODUCTS, type ProductKey } from "./products";
import { stripe } from "./stripe";
import {
  adminRecipients,
  claimOnce,
  createPayment,
  getPayment,
  getPaymentByIntent,
  getPaymentBySession,
  releaseClaim,
  updatePayment,
  type Payment,
} from "./store";

/** Unpaid checkout pages close after this long. Stripe's minimum is 30 minutes. */
const CHECKOUT_LIFETIME_SECONDS = 60 * 60;

export const formUrl = (p: Pick<Payment, "access_token">) => `${siteBase()}/create?access=${p.access_token}`;
export const retryUrl = (product: ProductKey) => `${siteBase()}/pay?product=${product}`;
const dashboardUrl = () => `${siteBase()}/admin/payments`;
const amountOf = (p: Pick<Payment, "amount_cents" | "currency">) => formatMoney(p.amount_cents, p.currency);
const idOf = (value: string | { id: string } | null | undefined) => (typeof value === "string" ? value : (value?.id ?? null));

export async function startCheckout(product: ProductKey, email?: string | null): Promise<string> {
  const item = PRODUCTS[product];
  const payment = await createPayment({ product, amountCents: item.amountCents, currency: item.currency });
  const metadata = { payment_id: payment.id, product };
  const session = await stripe().checkout.sessions.create(
    {
      mode: "payment",
      // Always charge in USD with the card form, whatever the visitor's country or dashboard settings.
      adaptive_pricing: { enabled: false },
      allowed_payment_method_types: ["card"],
      client_reference_id: payment.id,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: item.currency,
            unit_amount: item.amountCents,
            product_data: { name: item.name, description: item.summary },
          },
        },
      ],
      ...(email ? { customer_email: email } : {}),
      customer_creation: "always",
      billing_address_collection: "auto",
      invoice_creation: { enabled: true, invoice_data: { description: item.name, metadata } },
      payment_intent_data: { description: item.name, metadata },
      metadata,
      expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_LIFETIME_SECONDS,
      success_url: `${siteBase()}/pay/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteBase()}/pay?product=${product}&cancelled=1`,
    },
    { idempotencyKey: `checkout-${payment.id}` },
  );
  await updatePayment(payment.id, { stripe_session_id: session.id, livemode: session.livemode });
  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return session.url;
}

async function paymentForSession(session: Stripe.Checkout.Session): Promise<Payment | null> {
  const id = session.metadata?.payment_id ?? session.client_reference_id;
  return (id ? await getPayment(id) : null) ?? (await getPaymentBySession(session.id));
}

async function invoiceLinks(invoiceId: string | null) {
  if (!invoiceId) return { invoice_url: null, invoice_pdf: null };
  try {
    const invoice = await stripe().invoices.retrieve(invoiceId);
    return { invoice_url: invoice.hosted_invoice_url ?? null, invoice_pdf: invoice.invoice_pdf ?? null };
  } catch (e) {
    console.error("[payments] invoice lookup failed", invoiceId, e);
    return { invoice_url: null, invoice_pdf: null };
  }
}

/**
 * Brings a payment in line with its Checkout Session. Safe to call from both the webhook and the
 * success page: whichever runs first marks it paid, and the access email is only ever sent once.
 */
export async function syncCheckoutSession(session: Stripe.Checkout.Session): Promise<Payment | null> {
  const payment = await paymentForSession(session);
  if (!payment) {
    console.error("[payments] no payment for session", session.id);
    return null;
  }
  if (session.payment_status !== "paid") return payment;

  const invoiceId = idOf(session.invoice);
  const links = invoiceLinks(invoiceId);
  const updated = await updatePayment(
    payment.id,
    {
      status: "paid",
      paid_at: payment.paid_at ?? new Date().toISOString(),
      email: session.customer_details?.email?.toLowerCase() ?? payment.email,
      customer_name: session.customer_details?.name ?? payment.customer_name,
      stripe_session_id: session.id,
      stripe_payment_intent_id: idOf(session.payment_intent),
      stripe_customer_id: idOf(session.customer),
      stripe_invoice_id: invoiceId,
      livemode: session.livemode,
      failure_reason: null,
      ...(await links),
    },
    ["pending", "failed", "expired"],
  );
  const current = updated ?? (await getPayment(payment.id));
  if (!current) return null;
  if (updated) {
    await recordAudit({
      actor: null,
      action: "payments.paid",
      targetType: "payment",
      targetId: payment.id,
      details: { product: payment.product, amount: amountOf(payment), email: updated.email },
    });
  }
  if (current.status === "paid") await sendAccessEmail(current);
  // Only on the change to paid, so a redelivered webhook doesn't alert twice.
  if (updated) {
    await alertAdmins("paid", updated, "A client paid. They've been emailed a link to fill in their webpage details.");
  }
  return current;
}

async function sendAccessEmail(payment: Payment): Promise<void> {
  if (!payment.email || payment.used_at) return;
  if (!(await claimOnce(payment.id, "access_email_sent_at"))) return;
  const result = await sendEmail({
    to: { email: payment.email, ...(payment.customer_name ? { name: payment.customer_name } : {}) },
    ...paymentReceivedEmail({
      name: payment.customer_name,
      productName: PRODUCTS[payment.product].name,
      amount: amountOf(payment),
      formUrl: formUrl(payment),
      invoiceUrl: payment.invoice_url,
    }),
  });
  if (!result.ok) {
    console.error("[payments] access email failed", payment.id, result.error);
    await releaseClaim(payment.id, "access_email_sent_at");
  }
}

async function alertAdmins(kind: AdminPaymentAlert, payment: Payment, note: string, extra: [string, string][] = []) {
  const recipients = await adminRecipients();
  if (recipients.length === 0) {
    console.error("[payments] no admin recipients for alert", kind, payment.id);
    return;
  }
  const details: [string, string][] = [
    ["Client", [payment.customer_name, payment.email].filter(Boolean).join(" — ") || "Unknown"],
    ["Product", PRODUCTS[payment.product].name],
    ["Amount", amountOf(payment)],
    ...extra,
    ["Stripe payment", payment.stripe_payment_intent_id ?? payment.stripe_session_id ?? "—"],
    ["Mode", payment.livemode ? "Live" : "Test"],
  ];
  const content = adminPaymentEmail({ kind, details, note, dashboardUrl: dashboardUrl() });
  await Promise.all(
    recipients.map(async (email) => {
      const result = await sendEmail({ to: { email }, ...content });
      if (!result.ok) console.error("[payments] admin alert failed", kind, payment.id, result.error);
    }),
  );
}

/** A card was declined or a payment attempt failed. The client may still retry on the same page. */
export async function recordFailedAttempt(intent: Stripe.PaymentIntent): Promise<Payment | null> {
  const paymentId = intent.metadata?.payment_id;
  const payment = (paymentId ? await getPayment(paymentId) : null) ?? (await getPaymentByIntent(intent.id));
  if (!payment) return null;
  const error = intent.last_payment_error;
  const email = error?.payment_method?.billing_details?.email ?? intent.receipt_email ?? null;
  const name = error?.payment_method?.billing_details?.name ?? null;
  return updatePayment(
    payment.id,
    {
      status: "failed",
      failure_reason: (error?.message ?? error?.decline_code ?? error?.code ?? "Payment failed").slice(0, 500),
      failed_attempts: payment.failed_attempts + 1,
      stripe_payment_intent_id: intent.id,
      email: payment.email ?? email?.toLowerCase() ?? null,
      customer_name: payment.customer_name ?? name,
      livemode: intent.livemode,
    },
    ["pending", "failed"],
  );
}

/** Tells the client and the admins that a payment failed. Sent once per payment. */
export async function notifyFailure(payment: Payment): Promise<void> {
  if (!(await claimOnce(payment.id, "failure_notified_at"))) return;
  if (payment.email) {
    const result = await sendEmail({
      to: { email: payment.email, ...(payment.customer_name ? { name: payment.customer_name } : {}) },
      ...paymentFailedEmail({
        name: payment.customer_name,
        productName: PRODUCTS[payment.product].name,
        amount: amountOf(payment),
        reason: payment.failure_reason,
        retryUrl: retryUrl(payment.product),
      }),
    });
    if (!result.ok) console.error("[payments] failure email failed", payment.id, result.error);
  }
  await alertAdmins(
    "failed",
    payment,
    payment.email
      ? "A client's payment failed. They have been emailed a new link to try again."
      : "A client's payment failed. Stripe didn't give us their email, so they were not emailed.",
    [
      ["Reason", payment.failure_reason ?? "Not given"],
      ["Attempts", String(payment.failed_attempts)],
    ],
  );
  await recordAudit({
    actor: null,
    action: "payments.failed",
    targetType: "payment",
    targetId: payment.id,
    details: { product: payment.product, email: payment.email, reason: payment.failure_reason },
  });
}

/** Bank-transfer style payments that fail after checkout. */
export async function handleAsyncFailure(session: Stripe.Checkout.Session): Promise<Payment | null> {
  const payment = await paymentForSession(session);
  if (!payment) return null;
  const updated = await updatePayment(
    payment.id,
    {
      status: "failed",
      failure_reason: payment.failure_reason ?? "The payment could not be completed.",
      failed_attempts: payment.failed_attempts + 1,
      email: session.customer_details?.email?.toLowerCase() ?? payment.email,
      customer_name: session.customer_details?.name ?? payment.customer_name,
      stripe_payment_intent_id: idOf(session.payment_intent) ?? payment.stripe_payment_intent_id,
    },
    ["pending", "failed"],
  );
  if (updated) await notifyFailure(updated);
  return updated;
}

/**
 * The checkout page closed without a payment. If the client had a failed attempt, this is when
 * we tell them, so nobody gets a "failed" email while they are still retrying with another card.
 */
export async function handleSessionExpired(session: Stripe.Checkout.Session): Promise<Payment | null> {
  const payment = await paymentForSession(session);
  if (!payment) return null;
  const email = session.customer_details?.email?.toLowerCase() ?? payment.email;
  if (payment.status === "failed") {
    const updated = (await updatePayment(payment.id, { email }, ["failed"])) ?? payment;
    await notifyFailure(updated);
    return updated;
  }
  return updatePayment(payment.id, { status: "expired", email }, ["pending"]);
}

async function takeEntryOffline(payment: Payment, reason: "refunded" | "disputed"): Promise<string | null> {
  if (!payment.entry_id) return null;
  const { data, error } = await serviceClient()
    .from("entries")
    .update({ status: "suspended" })
    .eq("id", payment.entry_id)
    .eq("status", "approved")
    .select("id,slug,business_name")
    .maybeSingle<{ id: string; slug: string; business_name: string }>();
  if (error) {
    console.error("[payments] could not take webpage offline", payment.entry_id, error.message);
    return null;
  }
  if (!data) return null;
  revalidateTag(`site:${data.slug}`, { expire: 0 });
  await recordAudit({
    actor: null,
    action: "webpages.suspended",
    targetType: "entry",
    targetId: data.id,
    details: { slug: data.slug, business: data.business_name, reason: `payment ${reason}` },
  });
  return data.slug;
}

export async function handleRefund(charge: Stripe.Charge): Promise<Payment | null> {
  const intentId = idOf(charge.payment_intent);
  const payment = intentId ? await getPaymentByIntent(intentId) : null;
  if (!payment) return null;
  const full = charge.refunded || charge.amount_refunded >= charge.amount;
  if (!full) {
    const updated = await updatePayment(payment.id, { amount_refunded_cents: charge.amount_refunded });
    if (updated) {
      await alertAdmins("refunded", updated, "Part of a payment was refunded. The webpage stays online.", [
        ["Refunded", formatMoney(charge.amount_refunded, charge.currency)],
      ]);
    }
    return updated;
  }
  const updated = await updatePayment(
    payment.id,
    { status: "refunded", refunded_at: new Date().toISOString(), amount_refunded_cents: charge.amount_refunded },
    ["paid", "disputed", "failed", "pending"],
  );
  if (!updated) return payment;
  const slug = await takeEntryOffline(updated, "refunded");
  await alertAdmins(
    "refunded",
    updated,
    slug
      ? `This payment was fully refunded, so the webpage /${slug} was taken offline.`
      : updated.used_at
        ? "This payment was fully refunded. Its webpage was not live, so nothing was taken offline."
        : "This payment was fully refunded. The client's form link no longer works.",
    [["Refunded", formatMoney(charge.amount_refunded, charge.currency)]],
  );
  await recordAudit({ actor: null, action: "payments.refunded", targetType: "payment", targetId: payment.id, details: { slug } });
  return updated;
}

export async function handleDispute(dispute: Stripe.Dispute): Promise<Payment | null> {
  const intentId = idOf(dispute.payment_intent);
  const payment = intentId ? await getPaymentByIntent(intentId) : null;
  if (!payment) return null;
  const updated = await updatePayment(
    payment.id,
    { status: "disputed", disputed_at: new Date().toISOString() },
    ["paid", "pending", "failed"],
  );
  if (!updated) return payment;
  const slug = await takeEntryOffline(updated, "disputed");
  await alertAdmins(
    "disputed",
    updated,
    `${slug ? `The webpage /${slug} was taken offline. ` : "The client's form link no longer works. "}Respond to the dispute in Stripe before its deadline.`,
    [["Dispute reason", dispute.reason.replaceAll("_", " ")]],
  );
  await recordAudit({ actor: null, action: "payments.disputed", targetType: "payment", targetId: payment.id, details: { slug, reason: dispute.reason } });
  return updated;
}

export async function alertReplaceFailure(payment: Payment, message: string) {
  await alertAdmins("replace_failed", payment, message);
}
