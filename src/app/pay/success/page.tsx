import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { Clock, LoaderCircle } from "lucide-react";
import { syncCheckoutSession } from "@/lib/payments/service";
import { stripe } from "@/lib/payments/stripe";

export const metadata: Metadata = { title: "Payment — Affordabiz", robots: { index: false } };

type Search = Promise<{ session_id?: string }>;

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 sm:p-10">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-teal-50 text-teal-800">
        <Clock className="size-6" aria-hidden />
      </span>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
      <div className="mt-3 space-y-3 text-slate-600">{children}</div>
    </div>
  );
}

async function Result({ searchParams }: { searchParams: Search }) {
  const { session_id: sessionId } = await searchParams;
  let destination: string | null = null;
  let failed = false;

  if (sessionId?.startsWith("cs_")) {
    try {
      const session = await stripe().checkout.sessions.retrieve(sessionId);
      const payment = await syncCheckoutSession(session);
      // /create shows the form, or the finished webpage if this payment was already used.
      if (payment?.status === "paid") destination = `/create?access=${payment.access_token}`;
    } catch (e) {
      console.error("[pay] success lookup failed", sessionId, e);
      failed = true;
    }
  }
  if (destination) redirect(destination);

  return (
    <Card title={failed ? "We're confirming your payment" : "Your payment is processing"}>
      <p>
        As soon as your payment is confirmed, we&apos;ll email you your invoice and the link to fill in your webpage
        details. This usually takes a few minutes.
      </p>
      <p className="text-sm">
        Didn&apos;t pay yet?{" "}
        <Link href="/pay" className="font-semibold text-teal-800 underline">
          Go back to payment
        </Link>
      </p>
    </Card>
  );
}

export default function PaySuccessPage({ searchParams }: { searchParams: Search }) {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-16 sm:py-24">
      <Suspense
        fallback={
          <p className="flex items-center justify-center gap-2 text-sm text-slate-500">
            <LoaderCircle className="size-4 animate-spin" aria-hidden /> Confirming your payment…
          </p>
        }
      >
        <Result searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
