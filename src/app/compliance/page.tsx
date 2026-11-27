import type { Metadata } from "next";
import { SiteFooter } from "@/components/site/SiteFooter";

export const metadata: Metadata = { title: "Compliance | PTIN-Certified Tax Preparer" };

export default function CompliancePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0B1B2B]">
      <main className="relative isolate flex-1 overflow-hidden px-4 py-14 sm:px-6 sm:py-20">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[url('/site/compliance-bg.png')] bg-cover bg-center opacity-25" />
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-sm font-bold uppercase tracking-[0.2em] text-[#00ADEF]">Compliance</p>
          <h1 className="mt-3 text-center text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Compliance Docs – TaxProDocs E-Sign Training
          </h1>
          <div className="mt-10 aspect-video overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10">
            <iframe
              src="https://player.vimeo.com/video/500171228?dnt=1"
              title="Compliance Docs – TaxProDocs E-Sign Training"
              className="h-full w-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
