import { Open_Sans } from "next/font/google";
import { SiteFooter } from "./SiteFooter";

const openSans = Open_Sans({ subsets: ["latin"], weight: ["400", "600", "700"] });

export type LegalBlock = string | { list: string[] } | { label: string; list: string[] };
export interface LegalSection {
  heading: string;
  body: LegalBlock[];
}

/** Privacy Policy and Terms & Conditions, verbatim from the old site. */
export function LegalPage({ title, sections }: { title: string; sections: LegalSection[] }) {
  return (
    <div className={`${openSans.className} flex min-h-screen flex-col bg-white text-slate-700`}>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900">{title}</h1>
        <dl className="mt-4 text-sm">
          <div>
            <dt className="inline font-semibold text-slate-900">Effective Date: </dt>
            <dd className="inline">November 1, 2025</dd>
          </div>
          <div>
            <dt className="inline font-semibold text-slate-900">Website: </dt>
            <dd className="inline">TaxPrep.me</dd>
          </div>
        </dl>
        <div className="mt-10 divide-y divide-slate-200">
          {sections.map((s) => (
            <section key={s.heading} className="py-8 first:pt-0">
              <h2 className="text-2xl font-bold text-slate-900">{s.heading}</h2>
              <div className="mt-4 space-y-4 leading-relaxed">
                {s.body.map((b, i) =>
                  typeof b === "string" ? (
                    <p key={i}>{b}</p>
                  ) : (
                    <div key={i}>
                      {"label" in b && <p className="font-semibold text-slate-900">{b.label}</p>}
                      <ul className="mt-2 list-disc space-y-1 pl-5 marker:text-slate-400">
                        {b.list.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ),
                )}
              </div>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
