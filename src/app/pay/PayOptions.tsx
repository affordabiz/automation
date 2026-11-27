"use client";

import { useState, type FormEvent } from "react";
import { Check, LoaderCircle, Lock, RefreshCw, Sparkles } from "lucide-react";
import { formatMoney, PRODUCT_LIST, type ProductKey } from "@/lib/payments/products";

const ICONS: Record<ProductKey, typeof RefreshCw> = { renew: RefreshCw, new: Sparkles };
const POINTS: Record<ProductKey, string[]> = {
  renew: ["Same template as last year", "Update your details, logo and photo", "Keep your web address"],
  new: ["Choose any template", "A brand-new webpage, or a new look for yours", "Pick a new web address if you like"],
};

export function PayOptions({ initialProduct }: { initialProduct: ProductKey | null }) {
  const [product, setProduct] = useState<ProductKey | null>(initialProduct);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!product || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ product, email }),
      });
      const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (res.ok && body.url) {
        window.location.assign(body.url);
        return;
      }
      setError(body.error ?? "We couldn't open the payment page. Please try again.");
    } catch {
      setError("Network error. Please check your connection and try again.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <fieldset>
        <legend className="sr-only">Choose your webpage</legend>
        <div className="grid gap-4 md:grid-cols-2">
          {PRODUCT_LIST.map((p) => {
            const Icon = ICONS[p.key];
            const selected = product === p.key;
            return (
              <label
                key={p.key}
                className={`relative flex cursor-pointer flex-col rounded-3xl bg-white p-6 shadow-sm ring-1 transition sm:p-7 ${selected ? "ring-2 ring-teal-700" : "ring-slate-200 hover:ring-slate-300"}`}
              >
                <input
                  type="radio"
                  name="product"
                  value={p.key}
                  checked={selected}
                  onChange={() => setProduct(p.key)}
                  className="sr-only"
                />
                <span className="flex items-start justify-between gap-4">
                  <span className={`grid size-11 place-items-center rounded-2xl ${selected ? "bg-teal-700 text-white" : "bg-teal-50 text-teal-800"}`}>
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span
                    className={`grid size-6 place-items-center rounded-full ring-1 ${selected ? "bg-teal-700 text-white ring-teal-700" : "ring-slate-300"}`}
                    aria-hidden
                  >
                    {selected && <Check className="size-3.5" />}
                  </span>
                </span>
                <span className="mt-5 text-base font-semibold text-slate-900">{p.name}</span>
                <span className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                  {formatMoney(p.amountCents, p.currency)} <span className="text-sm font-medium text-slate-500">USD</span>
                </span>
                <ul className="mt-5 space-y-2 text-sm text-slate-600">
                  {POINTS[p.key].map((point) => (
                    <li key={point} className="flex gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-teal-700" aria-hidden />
                      {point}
                    </li>
                  ))}
                </ul>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-7">
        <label htmlFor="pay-email" className="block text-sm font-semibold text-slate-800">
          Email
        </label>
        <input
          id="pay-email"
          type="email"
          autoComplete="email"
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@business.com"
          className="mt-2 block w-full rounded-xl border-0 px-4 py-3 text-sm text-slate-900 shadow-sm ring-1 ring-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
        <p className="mt-2 text-xs text-slate-500">
          Renewing? Use the email from last year&apos;s webpage so we can find it. We&apos;ll send your invoice and form
          link here.
        </p>
      </div>

      <div className="flex flex-col items-start gap-3">
        {error && (
          <p role="alert" className="text-sm font-medium text-red-600">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={!product || busy}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Lock className="size-4" aria-hidden />}
          {busy ? "Opening secure payment…" : "Continue to payment"}
        </button>
        <p className="text-xs text-slate-500">Payments are processed securely by Stripe. We never see your card details.</p>
      </div>
    </form>
  );
}
