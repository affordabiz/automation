import { Mail, MapPin, Phone, Printer } from "lucide-react";
import type { Metadata } from "next";
import { Playfair_Display, Roboto } from "next/font/google";
import Image from "next/image";
import { LinkButton } from "@/components/site/LinkButton";

export const metadata: Metadata = { title: "Cheat Sheets | PTIN-Certified Tax Preparer" };

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["700"] });
const roboto = Roboto({ subsets: ["latin"], weight: ["400", "500", "700"] });

const SHEETS = [
  { label: "Rebate Recovery Credit Cheat Sheet", file: "Rebate-Recovery-Cheat-Sheat-2.pdf" },
  { label: "Sick Paid Leave for Self-Employed/W2 Cheat Sheet", file: "Contractor-Paid-Leave-Cheat-Sheat.pdf" },
  { label: "The EIC/ACTC Lookback Rule Cheat Sheet", file: "Look-Back-EITC-ACTC-Cheat-Sheat.pdf" },
  { label: "EIC and ACTC Fact Sheet", file: "FACT-SHEET-EICT-ACTC-.pdf" },
  { label: "What Will Delay Refunds Fact Sheet", file: "Freeze-Alerts-Wlll-Hold-Up-Refunds-1.pdf" },
  { label: "SBA PPP/EIDL Fact Sheet", file: "FACT-SHEET-Small-Business-Administration.pdf" },
];

export default function CheatSheetsPage() {
  return (
    <div className={`${roboto.className} flex min-h-screen flex-col bg-white text-slate-700`}>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <h1 className={`${playfair.className} text-center text-3xl leading-tight text-[#333] sm:text-5xl`}>
          COVID-Legislation Cheat Sheets for Preparers
        </h1>

        <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
          <aside className="mx-auto w-full max-w-sm text-center">
            <Image
              src="/site/affordatax-biz-in-a-box.png"
              alt="AffordaTax Biz-in-a-Box"
              width={480}
              height={410}
              className="w-full border-4 border-[#333] bg-white"
            />
            <p className="mt-6 leading-relaxed">
              Contact us at{" "}
              <a href="mailto:info@taxbizinbox.com" className="font-medium text-[#1E73BE] hover:underline">
                info@taxbizinbox.com
              </a>{" "}
              if you find any inaccurate info or info that needs to be updated on the &ldquo;COVID-Legislation Cheat
              Sheets.&rdquo;
            </p>
          </aside>

          <section aria-labelledby="sheets" className="rounded-3xl bg-[#80BEC5] p-5 sm:p-8">
            <h2 id="sheets" className="text-center text-lg font-bold tracking-wide text-black uppercase">
              Download the cheat sheets
            </h2>
            <ul className="mt-6 grid gap-3">
              {SHEETS.map((s) => (
                <li key={s.file}>
                  <LinkButton href={`/files/${s.file}`} tone="black" download className="uppercase tracking-wide">
                    {s.label}
                  </LinkButton>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>

      <footer className="bg-[#5A5A5A] px-4 py-8 text-sm text-white/90">
        <ul className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-6 gap-y-3 text-center">
          <li>© AffordaTax Biz-in-a-Box, Inc.</li>
          <li className="inline-flex items-center gap-1.5">
            <MapPin className="size-4 text-[#80BEC5]" aria-hidden />
            1227 Peachtree Pkwy, Ste 206 Peachtree City, GA 30269
          </li>
          <li>
            <a href="tel:6782789255" className="inline-flex items-center gap-1.5 hover:underline">
              <Phone className="size-4 text-[#80BEC5]" aria-hidden />
              (678) 278-9255
            </a>
          </li>
          <li className="inline-flex items-center gap-1.5">
            <Printer className="size-4 text-[#80BEC5]" aria-hidden />
            Fax: (404) 829-2387
          </li>
          <li>
            <a href="mailto:info@taxbizinbox.com" className="inline-flex items-center gap-1.5 hover:underline">
              <Mail className="size-4 text-[#80BEC5]" aria-hidden />
              info@taxbizinbox.com
            </a>
          </li>
        </ul>
      </footer>
    </div>
  );
}
