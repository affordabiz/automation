import type { Metadata } from "next";
import { SiteFooter } from "@/components/site/SiteFooter";

export const metadata: Metadata = { title: "Report Paid Upfront | PTIN-Certified Tax Preparer" };

const FORM_URL = "https://form.jotform.com/62646999636174";

export default function ReportPaidUpfrontPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FAF7F2]">
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Report Paid Upfront</h1>
        <p className="mx-auto mt-3 max-w-lg text-center text-slate-600">
          Let us know about a tax preparation fee that was paid upfront.
        </p>
        <div className="mt-8 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
          <iframe
            src={FORM_URL}
            title="Report paid upfront form"
            className="h-[1100px] w-full border-0"
            allow="geolocation; microphone; camera; fullscreen; payment"
          />
        </div>
        <p className="mt-4 text-center text-sm text-slate-500">
          Form not loading?{" "}
          <a href={FORM_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-[#1E73BE] underline">
            Open it in a new tab
          </a>
          .
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
