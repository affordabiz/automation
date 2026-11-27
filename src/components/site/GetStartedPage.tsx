import { ArrowUpRight, CalendarDays, Mail } from "lucide-react";
import { Poppins } from "next/font/google";
import Image from "next/image";
import { SiteFooter } from "./SiteFooter";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

const YELLOW = "#FCD40C";
const CONSULT_URL = "https://affordatax.hbportal.co/schedule/68dbf9610846c30027297331";

export interface GetStartedVariant {
  businessName: string;
  preparerEmail: string;
  uploadAppUrl: string;
  loginStepLabel: string;
}

export const GETSTARTED: GetStartedVariant = {
  businessName: "AffordaFinancial",
  preparerEmail: "intake@affordafinancial.com",
  uploadAppUrl: "https://taxestogo.com/App/Download/79615",
  loginStepLabel: "Login to the app change the taxes to go link I gave also More options",
};

export const GET_STARTED_HERE: GetStartedVariant = {
  businessName: "Afforda",
  preparerEmail: "lwebb@taxbizinbox.com",
  uploadAppUrl: "https://taxestogo.com/App/Download/84465",
  loginStepLabel: "Login to the app change the taxes to go link I gave also",
};

function Step({ n, label, href }: { n: number; label: string; href: string }) {
  const external = /^https?:/.test(href) || href.startsWith("mailto:");
  return (
    <li>
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="group flex min-h-14 items-center gap-4 rounded-full bg-black py-2.5 pr-5 pl-2.5 text-left text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-neutral-800 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
      >
        <span
          className="grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold text-black"
          style={{ backgroundColor: YELLOW }}
        >
          {n}
        </span>
        <span className="flex-1 text-[0.95rem] font-medium tracking-wide sm:text-base">{label}</span>
        <ArrowUpRight className="size-4 shrink-0 opacity-60 transition group-hover:opacity-100" aria-hidden />
      </a>
    </li>
  );
}

/** /getstarted and /get-started-here: free quote and the steps to start a tax return. */
export function GetStartedPage({ v }: { v: GetStartedVariant }) {
  const start = [
    { label: "Complete the Client Intake Form", href: "https://form.jotform.com/70070124860143" },
    { label: "Fill out the EIC Validation Form", href: "https://form.jotform.com/70088014642148" },
    { label: "Fill out the Schedule C Form - if you have a business or monetized hobby", href: "https://form.jotform.com/60217037569154" },
    { label: "Upload ALL Tax Docs in the Secure Software App", href: v.uploadAppUrl },
    { label: "Let us know change my email vs compliance", href: "mailto:lwebb@taxbizinbox.com" },
  ];
  const next = [
    { label: v.loginStepLabel, href: "https://taxestogo.com/App/Download/79615" },
    { label: "Obtain a Signed Copy of Your Tax Return", href: "https://affordatax.hbportal.co/app/" },
    { label: "If You'd Like To Chat, Book It", href: "https://affordatax.hbportal.co/schedule/68ed12c6ac8fee0027cf7ff5" },
  ];

  return (
    <div className={`${poppins.className} flex min-h-screen flex-col bg-white text-neutral-900`}>
      <p className="bg-[#111] px-4 py-2.5 text-center text-xs font-semibold tracking-wide text-white sm:text-sm">
        RECEIVE <span style={{ color: YELLOW }}>$50 Referrals</span> for NEW CLIENTS
      </p>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
          <Image
            src="/site/afforda-financial-logo.jpg"
            alt="AffordaFinancial logo"
            width={96}
            height={90}
            priority
            className="mx-auto h-20 w-auto"
          />
          <h1 className="mt-6 text-center text-3xl font-semibold tracking-tight sm:text-4xl">
            Get Your Free Quote / Start your Tax Preparation
          </h1>

          <div className="mt-10 grid items-center gap-10 lg:grid-cols-2">
            <div className="space-y-5 text-lg">
              <p className="italic text-neutral-700">Thank you for trusting {v.businessName} with your business!</p>
              <p className="text-sm font-semibold tracking-[0.15em] text-neutral-500 uppercase">Please read thoroughly</p>
              <p>
                There is a section to insert <strong>your Tax Preparer&apos;s email:</strong>
              </p>
              <a
                href={`mailto:${v.preparerEmail}`}
                className="inline-flex max-w-full items-center gap-2 rounded-xl px-4 py-3 font-semibold break-all text-black transition hover:brightness-95"
                style={{ backgroundColor: YELLOW }}
              >
                <Mail className="size-5 shrink-0" aria-hidden />
                {v.preparerEmail}
              </a>
              <p>
                <a
                  href={CONSULT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-bold italic underline decoration-2 underline-offset-4 hover:decoration-[#FCD40C]"
                >
                  <CalendarDays className="size-5 not-italic" aria-hidden />
                  Not Ready Yet? Book a Consultation!
                </a>
              </p>
            </div>
            <Image
              src="/site/get-started.webp"
              alt="Writing notes next to a laptop"
              width={800}
              height={533}
              className="aspect-[3/2] w-full rounded-3xl object-cover shadow-xl"
            />
          </div>
        </section>

        <section style={{ backgroundColor: YELLOW }} className="px-4 py-14 sm:px-6 lg:py-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-3xl font-medium tracking-wide text-neutral-900 sm:text-4xl">Start Your Tax Preparation</h2>
            <p className="mt-2 text-center text-neutral-800">Get Started</p>
            <ol className="mt-8 space-y-4">
              {start.map((s, i) => (
                <Step key={s.label} n={i + 1} {...s} />
              ))}
            </ol>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6 lg:py-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-3xl font-medium tracking-wide sm:text-4xl">When Your Tax Return is Prepared</h2>
            <p className="mt-2 text-center text-neutral-600">Next Steps</p>
            <ol className="mt-8 space-y-4">
              {next.map((s, i) => (
                <Step key={s.label} n={i + 1} {...s} />
              ))}
            </ol>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
