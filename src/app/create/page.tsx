import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { CircleCheck, CreditCard, ExternalLink, LoaderCircle } from "lucide-react";
import { ownPages, resolveAccess } from "@/lib/payments/access";
import { PRODUCTS } from "@/lib/payments/products";
import { siteBase, siteUrl } from "@/lib/siteUrl";
import { OnboardingForm } from "./OnboardingForm";

export const metadata: Metadata = { title: "Create your webpage — Affordabiz", robots: { index: false } };

type Search = Promise<{ access?: string }>;

function Notice({ title, children, done = false }: { title: string; children: ReactNode; done?: boolean }) {
  const Icon = done ? CircleCheck : CreditCard;
  return (
    <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200 sm:p-10">
      <span className={`grid size-12 place-items-center rounded-2xl ${done ? "bg-emerald-50 text-emerald-700" : "bg-teal-50 text-teal-800"}`}>
        <Icon className="size-6" aria-hidden />
      </span>
      <h2 className="mt-5 text-xl font-semibold text-slate-900">{title}</h2>
      <div className="mt-2 space-y-4 text-slate-600">{children}</div>
    </div>
  );
}

const payButton = (href = "/pay", label = "Choose and pay") => (
  <Link
    href={href}
    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
  >
    {label}
  </Link>
);

async function Content({ searchParams }: { searchParams: Search }) {
  const { access: token } = await searchParams;
  const access = await resolveAccess(token);

  switch (access.state) {
    case "missing":
    case "invalid":
      return (
        <Notice title={access.state === "missing" ? "Pay first to create your webpage" : "This link isn't valid"}>
          <p>
            {access.state === "missing"
              ? "Choose a webpage option and pay securely. Straight after payment you'll come back here to fill in your details."
              : "Use the link from your payment email, or choose an option and pay to get a new one."}
          </p>
          {payButton()}
        </Notice>
      );
    case "unpaid":
      return (
        <Notice title="Your payment isn't complete">
          <p>We haven&apos;t received your payment yet, so this form is locked. You can try paying again below.</p>
          {payButton(`/pay?product=${access.payment.product}`, "Try payment again")}
        </Notice>
      );
    case "revoked":
      return (
        <Notice title="This link no longer works">
          <p>This payment was refunded or disputed. If you think this is a mistake, please reply to your payment email.</p>
        </Notice>
      );
    case "used": {
      const live = access.entry?.status === "approved";
      return (
        <Notice title="You've already submitted your details" done>
          <p>This payment has already been used to create a webpage.</p>
          {live && access.entry ? (
            <a
              href={siteUrl(access.entry.slug)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-semibold text-teal-800 underline"
            >
              View your webpage <ExternalLink className="size-4" aria-hidden />
            </a>
          ) : (
            <p>We&apos;ll email you the link as soon as your webpage is ready.</p>
          )}
        </Notice>
      );
    }
    case "ok": {
      const { payment } = access;
      const pages = await ownPages(payment.email);
      return (
        <>
          <p className="mb-6 flex items-center gap-2 rounded-2xl bg-emerald-50 px-5 py-4 text-sm text-emerald-900 ring-1 ring-emerald-200">
            <CircleCheck className="size-4 shrink-0" aria-hidden />
            <span>
              Payment received for <strong>{PRODUCTS[payment.product].name}</strong>. Your invoice is on its way to{" "}
              {payment.email ?? "your email"}.
            </span>
          </p>
          <OnboardingForm
            siteHost={siteBase().replace(/^https?:\/\//, "")}
            access={payment.access_token}
            product={payment.product}
            paymentEmail={payment.email}
            pages={pages}
          />
        </>
      );
    }
  }
}

export default function CreatePage({ searchParams }: { searchParams: Search }) {
  return (
    <div className="min-h-screen bg-slate-50 py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-5">
        <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Affordabiz</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Create your webpage</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Fill in your details and submit. Your webpage goes live straight away, and we&apos;ll email you the link.
        </p>
        <div className="mt-10">
          <Suspense
            fallback={
              <p className="flex items-center gap-2 text-sm text-slate-500">
                <LoaderCircle className="size-4 animate-spin" aria-hidden /> Loading…
              </p>
            }
          >
            <Content searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
