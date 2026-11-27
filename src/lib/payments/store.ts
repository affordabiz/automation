import "server-only";
import { serviceClient } from "@/lib/supabase/service";
import type { PaymentStatus, ProductKey } from "./products";

export interface Payment {
  id: string;
  product: ProductKey;
  amount_cents: number;
  currency: string;
  status: PaymentStatus;
  email: string | null;
  customer_name: string | null;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_customer_id: string | null;
  stripe_invoice_id: string | null;
  invoice_url: string | null;
  invoice_pdf: string | null;
  livemode: boolean;
  failure_reason: string | null;
  failed_attempts: number;
  failure_notified_at: string | null;
  access_token: string;
  access_email_sent_at: string | null;
  entry_id: string | null;
  previous_entry_id: string | null;
  used_at: string | null;
  paid_at: string | null;
  amount_refunded_cents: number;
  refunded_at: string | null;
  disputed_at: string | null;
  created_at: string;
}

const COLUMNS =
  "id,product,amount_cents,currency,status,email,customer_name,stripe_session_id,stripe_payment_intent_id,stripe_customer_id,stripe_invoice_id,invoice_url,invoice_pdf,livemode,failure_reason,failed_attempts,failure_notified_at,access_token,access_email_sent_at,entry_id,previous_entry_id,used_at,paid_at,amount_refunded_cents,refunded_at,disputed_at,created_at";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: unknown): value is string => typeof value === "string" && UUID.test(value);

export async function createPayment(input: { product: ProductKey; amountCents: number; currency: string }): Promise<Payment> {
  const { data, error } = await serviceClient()
    .from("payments")
    .insert({ product: input.product, amount_cents: input.amountCents, currency: input.currency })
    .select(COLUMNS)
    .single<Payment>();
  if (error) throw new Error(`Could not create payment: ${error.message}`);
  return data;
}

async function findBy(column: string, value: string): Promise<Payment | null> {
  const { data, error } = await serviceClient().from("payments").select(COLUMNS).eq(column, value).maybeSingle<Payment>();
  if (error) throw new Error(`Could not load payment: ${error.message}`);
  return data;
}

export const getPayment = (id: string) => (isUuid(id) ? findBy("id", id) : Promise.resolve(null));
export const getPaymentByToken = (token: string) => (isUuid(token) ? findBy("access_token", token) : Promise.resolve(null));
export const getPaymentBySession = (sessionId: string) => findBy("stripe_session_id", sessionId);

export async function getPaymentByIntent(intentId: string): Promise<Payment | null> {
  const { data, error } = await serviceClient()
    .from("payments")
    .select(COLUMNS)
    .eq("stripe_payment_intent_id", intentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<Payment>();
  if (error) throw new Error(`Could not load payment: ${error.message}`);
  return data;
}

/**
 * Updates a payment. With `onlyIf`, the update applies only while the payment still has one of those
 * statuses, which keeps concurrent webhooks from overwriting each other. Returns null when nothing changed.
 */
export async function updatePayment(
  id: string,
  patch: Partial<Omit<Payment, "id" | "created_at">>,
  onlyIf?: readonly PaymentStatus[],
): Promise<Payment | null> {
  let query = serviceClient().from("payments").update(patch).eq("id", id);
  if (onlyIf) query = query.in("status", onlyIf);
  const { data, error } = await query.select(COLUMNS).maybeSingle<Payment>();
  if (error) throw new Error(`Could not update payment: ${error.message}`);
  return data;
}

/** Sets a timestamp column only if it is still empty. Returns true for the one caller that set it. */
export async function claimOnce(
  id: string,
  column: "access_email_sent_at" | "failure_notified_at" | "used_at",
): Promise<boolean> {
  const { data, error } = await serviceClient()
    .from("payments")
    .update({ [column]: new Date().toISOString() })
    .eq("id", id)
    .is(column, null)
    .select("id")
    .maybeSingle();
  if (error) throw new Error(`Could not update payment: ${error.message}`);
  return Boolean(data);
}

export async function releaseClaim(id: string, column: "access_email_sent_at" | "failure_notified_at" | "used_at") {
  const { error } = await serviceClient().from("payments").update({ [column]: null }).eq("id", id);
  if (error) console.error("[payments] could not release claim", id, column, error.message);
}

export async function listPayments(limit = 500): Promise<Payment[]> {
  const { data, error } = await serviceClient()
    .from("payments")
    .select(COLUMNS)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Could not load payments: ${error.message}`);
  return (data ?? []) as Payment[];
}

/** A failed payment is resolved once the same email pays successfully afterwards. */
export function isResolvedFailure(
  failed: Pick<Payment, "email" | "created_at">,
  all: readonly Pick<Payment, "email" | "status" | "created_at">[],
): boolean {
  if (!failed.email) return false;
  return all.some(
    (p) =>
      p.email === failed.email &&
      (p.status === "paid" || p.status === "refunded" || p.status === "disputed") &&
      p.created_at > failed.created_at,
  );
}

export async function countFailedPayments(): Promise<number> {
  const { data, error } = await serviceClient()
    .from("payments")
    .select("email,status,created_at")
    .in("status", ["failed", "paid", "refunded", "disputed"])
    .order("created_at", { ascending: false })
    .limit(2000);
  if (error) throw new Error(`Could not count payments: ${error.message}`);
  const rows = (data ?? []) as Pick<Payment, "email" | "status" | "created_at">[];
  return rows.filter((p) => p.status === "failed" && !isResolvedFailure(p, rows)).length;
}

/** Returns true the first time an event id is recorded. */
export async function hasHandledEvent(eventId: string): Promise<boolean> {
  const { count, error } = await serviceClient()
    .from("payment_events")
    .select("id", { count: "exact", head: true })
    .eq("id", eventId);
  if (error) throw new Error(`Could not check event: ${error.message}`);
  return (count ?? 0) > 0;
}

export async function recordEvent(eventId: string, type: string, paymentId: string | null): Promise<void> {
  const { error } = await serviceClient()
    .from("payment_events")
    .upsert({ id: eventId, type, payment_id: paymentId }, { onConflict: "id", ignoreDuplicates: true });
  if (error) console.error("[payments] event not recorded", eventId, error.message);
}

/** Who gets payment alerts: PAYMENTS_ADMIN_EMAILS if set, otherwise every active Owner. */
export async function adminRecipients(): Promise<string[]> {
  const configured = (process.env.PAYMENTS_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (configured.length > 0) return [...new Set(configured)];
  const { data, error } = await serviceClient()
    .from("team_members")
    .select("email,status,roles!inner(is_owner)")
    .eq("status", "active")
    .eq("roles.is_owner", true);
  if (error) {
    console.error("[payments] admin recipients unavailable", error.message);
    return [];
  }
  return [...new Set((data ?? []).map((r) => String(r.email).toLowerCase()).filter(Boolean))];
}
