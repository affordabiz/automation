import { Roboto } from "next/font/google";
import type { ReactNode } from "react";
import { LinkButton, type ButtonTone } from "./LinkButton";
import { SiteFooter } from "./SiteFooter";

const roboto = Roboto({ subsets: ["latin"], weight: ["400", "500", "700"] });

export const CHECKLIST_PDF = "/files/Tax-Preparation-Client-Checklist.pdf";
export const PAY_FEE_URL = "https://form.jotform.com/193524054259056";
const FORMS = {
  eic: "https://form.jotform.com/70088014642148",
  intake: "https://form.jotform.com/70070124860143",
  scheduleC: "https://form.jotform.com/60217037569154",
  household: "https://form.jotform.com/60217413772148",
};
const IRS = {
  ipPin: "https://www.irs.gov/identity-theft-fraud-scams/get-an-identity-protection-pin",
  transcript: "https://www.irs.gov/individuals/get-transcript",
  refund: "https://www.irs.gov/wheres-my-refund",
};
const INSTRUCTIONS_URL =
  "https://docs.google.com/document/d/1_xzp0tHYO6Mm1z9ZoWYKbpfk14-P_6m0HFzOLTgOaVY/edit?tab=t.34ydwfhjapmf";

interface Item {
  label: string;
  href: string;
  tone: ButtonTone;
  note?: string;
  download?: boolean;
}

function Section({ title, intro, items }: { title: string; intro?: ReactNode; items: Item[] }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-16px_rgba(0,0,0,0.18)] ring-1 ring-black/5 sm:p-8">
      <h2 className="text-center text-3xl font-bold tracking-tight text-black sm:text-4xl">{title}</h2>
      {intro && <p className="mx-auto mt-3 max-w-xl text-center text-slate-600">{intro}</p>}
      <ul className="mt-7 grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.label} className={item.note ? "sm:col-span-2" : ""}>
            <LinkButton href={item.href} tone={item.tone} download={item.download}>
              {item.label}
            </LinkButton>
            {item.note && <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-relaxed text-slate-600">{item.note}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}

const IP_PIN_NOTE =
  "IP Pins verify you, Spouse and Dependents identification, to avoid your refund being delayed when IRS mails you a Verification ID Letter.";
const TRANSCRIPT_NOTE =
  "To see what income has been reported under your SSN, find out how much you owe, look at your payment history, see your prior AGI, view your tax records.";

/** /intake and /intake2: the client forms and links every TaxPrep.me page points to. */
export function ClientFormsPage({ variant }: { variant: "intake" | "intake2" }) {
  const forms: Item[] = [
    { label: "Client Document Checklist", href: CHECKLIST_PDF, tone: "yellow", download: true },
    { label: "Client Intake Form", href: FORMS.intake, tone: "red" },
    { label: variant === "intake" ? "EIC/CTC/HOH Validation Form" : "Complete EIC Validation Form", href: FORMS.eic, tone: "yellow" },
    { label: variant === "intake" ? "Schedule C Validation Form" : "Complete Schedule C Validation Form", href: FORMS.scheduleC, tone: "yellow" },
    { label: "Household Help Validation Form", href: FORMS.household, tone: "black" },
  ];
  const irs: Item[] = [
    { label: "Get Taxpayer IP Pin", href: IRS.ipPin, tone: "blue", note: IP_PIN_NOTE },
    { label: "Get Taxpayer IRS Transcript", href: IRS.transcript, tone: "blue", note: TRANSCRIPT_NOTE },
  ];
  const sections =
    variant === "intake"
      ? [
          <Section key="forms" title="Client Forms" items={forms} />,
          <Section
            key="links"
            title="Client Links"
            items={[
              { label: "Instructions – Sign Your Return/Upload Tax Docs", href: INSTRUCTIONS_URL, tone: "purple" },
              { label: "Click To Pay Your Tax Prep Fee Upfront", href: PAY_FEE_URL, tone: "green" },
              ...irs,
            ]}
          />,
        ]
      : [
          <Section
            key="links"
            title="Client Links"
            items={[{ label: "Click To Pay Your Tax Prep Fee Upfront", href: PAY_FEE_URL, tone: "green" }]}
          />,
          <Section key="forms" title="Client Forms" items={forms} />,
          <Section key="irs" title="IRS Links" items={[...irs, { label: "Where's My Refund?", href: IRS.refund, tone: "blue" }]} />,
        ];

  return (
    <div className={`${roboto.className} flex min-h-screen flex-col bg-[#FAF7F2] text-slate-800`}>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-12 sm:gap-8 sm:px-6 sm:py-16">
        <header className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#940076]">TaxPrep.me</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-black sm:text-5xl">Client In-Take Forms</h1>
          <p className="mx-auto mt-3 max-w-lg text-slate-600">
            Everything you need to get your tax return started, signed and filed.
          </p>
        </header>
        {sections}
      </main>
      <SiteFooter />
    </div>
  );
}
