import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, FileText } from "lucide-react";
import { requirePermission } from "@/lib/admin/auth";
import { formatDate } from "@/lib/admin/data";
import { hasPermission } from "@/lib/admin/permissions";
import {
  formatMoney,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUSES,
  PRODUCTS,
  type PaymentStatus,
} from "@/lib/payments/products";
import { isResolvedFailure, listPayments, type Payment } from "@/lib/payments/store";

export const metadata: Metadata = { title: "Payments" };

const BADGE: Record<PaymentStatus, string> = {
  paid: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  failed: "bg-red-50 text-red-700 ring-red-600/15",
  pending: "bg-amber-50 text-amber-800 ring-amber-600/20",
  expired: "bg-slate-100 text-slate-600 ring-slate-500/15",
  refunded: "bg-violet-50 text-violet-700 ring-violet-600/15",
  disputed: "bg-orange-50 text-orange-800 ring-orange-600/20",
};

const SHORT_PRODUCT = { renew: "Renew", new: "New webpage" } as const;

function stripeLink(p: Payment): string | null {
  const base = `https://dashboard.stripe.com${p.livemode ? "" : "/test"}`;
  if (p.stripe_payment_intent_id) return `${base}/payments/${p.stripe_payment_intent_id}`;
  if (p.stripe_session_id) return `${base}/checkout/sessions/${p.stripe_session_id}`;
  return null;
}

function formState(p: Payment): string {
  if (p.status !== "paid") return "—";
  if (p.used_at) return "Submitted";
  return "Not filled in yet";
}

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: requested } = await searchParams;
  const actor = await requirePermission("payments.view");
  const canOpenEntry = hasPermission(actor, "entries.view");
  const all = await listPayments();
  const filter = PAYMENT_STATUSES.includes(requested as PaymentStatus) ? (requested as PaymentStatus) : null;
  const rows = filter ? all.filter((p) => p.status === filter) : all;

  const count = (s: PaymentStatus) => all.filter((p) => p.status === s).length;
  const resolved = new Set(all.filter((p) => p.status === "failed" && isResolvedFailure(p, all)).map((p) => p.id));
  const openFailures = count("failed") - resolved.size;
  const collected = all
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount_cents - p.amount_refunded_cents, 0);
  const waiting = all.filter((p) => p.status === "paid" && !p.used_at).length;

  const tabs: { label: string; value: PaymentStatus | null; n: number }[] = [
    { label: "All", value: null, n: all.length },
    ...PAYMENT_STATUSES.map((s) => ({ label: PAYMENT_STATUS_LABELS[s], value: s, n: count(s) })),
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
        <p className="mt-1 text-sm text-slate-600">
          Stripe payments for webpages. Failed payments email the client a new link automatically. Refunded or disputed
          payments take their webpage offline.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Collected" value={formatMoney(collected)} />
        <Stat label="Paid" value={String(count("paid"))} hint={waiting ? `${waiting} haven't filled in the form` : undefined} />
        <Stat
          label="Failed"
          value={String(openFailures)}
          tone={openFailures ? "bad" : undefined}
          hint={resolved.size ? `${resolved.size} more paid later` : undefined}
        />
        <Stat label="Refunded or disputed" value={String(count("refunded") + count("disputed"))} />
      </div>

      <nav aria-label="Filter payments" className="flex gap-1 overflow-x-auto">
        {tabs.map((t) => {
          const on = t.value === filter;
          return (
            <Link
              key={t.label}
              href={t.value ? `/admin/payments?status=${t.value}` : "/admin/payments"}
              aria-current={on ? "page" : undefined}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium ${on ? "bg-teal-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              {t.label} <span className={on ? "text-teal-100" : "text-slate-400"}>{t.n}</span>
            </Link>
          );
        })}
      </nav>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Date (UTC)</th>
              <th scope="col" className="px-4 py-3 font-semibold">Client</th>
              <th scope="col" className="px-4 py-3 font-semibold">Product</th>
              <th scope="col" className="px-4 py-3 font-semibold">Amount</th>
              <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              <th scope="col" className="px-4 py-3 font-semibold">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((p) => {
              const stripeUrl = stripeLink(p);
              return (
                <tr key={p.id} className="align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {formatDate(p.paid_at ?? p.created_at)}
                    {!p.livemode ? <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-500">Test</span> : null}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{p.customer_name ?? "—"}</p>
                    <p className="text-slate-500">{p.email ?? "No email yet"}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700" title={PRODUCTS[p.product].name}>{SHORT_PRODUCT[p.product]}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium">
                    {formatMoney(p.amount_cents, p.currency)}
                    {p.amount_refunded_cents > 0 ? (
                      <p className="text-xs font-normal text-violet-700">−{formatMoney(p.amount_refunded_cents, p.currency)} refunded</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${BADGE[p.status]}`}>
                      {PAYMENT_STATUS_LABELS[p.status]}
                    </span>
                  </td>
                  <td className="space-y-1 px-4 py-3 text-slate-600">
                    {p.status === "failed" || (p.failure_reason && p.status !== "paid") ? (
                      <p className="text-red-700">
                        {p.failure_reason ?? "Payment failed"}
                        {p.failed_attempts > 1 ? ` (${p.failed_attempts} attempts)` : ""}
                        {p.failure_notified_at ? " · client emailed" : " · client not emailed yet"}
                      </p>
                    ) : null}
                    {resolved.has(p.id) ? <p className="font-medium text-emerald-700">Paid later</p> : null}
                    {p.status === "paid" ? <p>Form: {formState(p)}</p> : null}
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {p.entry_id && canOpenEntry ? (
                        <Link href={`/admin/entries/${p.entry_id}`} className="font-medium text-teal-800 hover:underline">Webpage</Link>
                      ) : null}
                      {p.previous_entry_id && canOpenEntry ? (
                        <Link href={`/admin/entries/${p.previous_entry_id}`} className="font-medium text-teal-800 hover:underline">Replaced page</Link>
                      ) : null}
                      {p.invoice_url ? (
                        <a href={p.invoice_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-teal-800 hover:underline">
                          <FileText className="size-3.5" aria-hidden /> Invoice
                        </a>
                      ) : null}
                      {stripeUrl ? (
                        <a href={stripeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-teal-800 hover:underline">
                          Stripe <ExternalLink className="size-3.5" aria-hidden />
                        </a>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">No payments here yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "bad" }) {
  return (
    <div className={`rounded-xl border bg-white p-5 ${tone === "bad" ? "border-red-200" : "border-slate-200"}`}>
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className={`mt-2 text-3xl font-bold tracking-tight ${tone === "bad" ? "text-red-700" : ""}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
