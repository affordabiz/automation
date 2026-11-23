import type { Metadata } from "next";
import { OnboardingForm } from "./OnboardingForm";

export const metadata: Metadata = { title: "Create your webpage — Affordabiz" };

export default function CreatePage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-5">
        <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Affordabiz</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">Create your webpage</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Fill in your details, pick a template and your professional webpage goes live instantly. We&apos;ll
          email you the link.
        </p>
        <div className="mt-10">
          <OnboardingForm />
        </div>
      </div>
    </div>
  );
}
