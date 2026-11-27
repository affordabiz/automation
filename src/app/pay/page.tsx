import type { Metadata } from "next";
import { Suspense } from "react";
import { isProductKey } from "@/lib/payments/products";
import { PayOptions } from "./PayOptions";

export const metadata: Metadata = { title: "Get your webpage — Affordabiz" };

type Search = Promise<{ product?: string; cancelled?: string }>;

async function Options({ searchParams }: { searchParams: Search }) {
  const { product, cancelled } = await searchParams;
  return (
    <>
      {cancelled ? (
        <p className="mb-6 rounded-2xl bg-amber-50 px-5 py-4 text-sm text-amber-900 ring-1 ring-amber-200">
          Your payment wasn&apos;t completed, and you haven&apos;t been charged. You can try again below.
        </p>
      ) : null}
      <PayOptions initialProduct={isProductKey(product) ? product : null} />
    </>
  );
}

export default function PayPage({ searchParams }: { searchParams: Search }) {
  return (
    <div className="min-h-screen bg-slate-50 py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-5">
        <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Affordabiz</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Get your personalized webpage</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Choose an option and pay securely. Straight after payment you&apos;ll fill in your details, and your webpage goes
          live as soon as you submit them.
        </p>
        <div className="mt-10">
          <Suspense fallback={<PayOptions initialProduct={null} />}>
            <Options searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
