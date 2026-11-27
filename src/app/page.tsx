import { ArrowRight, BadgeCheck, CheckCircle2, PlayCircle } from "lucide-react";
import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/site/SiteFooter";
import { getTemplateCopy } from "@/lib/sanity/queries";
import { resolveTokens } from "@/lib/tokens";
import { visibleButtons } from "@/templates/shared/buttons";
import { ClientForms } from "@/templates/t1/ClientForms";
import { T1_DEFAULT_COPY } from "@/templates/t1/defaultCopy";
import { Faq } from "@/templates/t1/Faq";
import { Loans } from "@/templates/t1/Loans";
import { Services } from "@/templates/t1/Services";
import { btnArrow, btnOutlineLight, btnPrimary, container, display, h2, section, T1_THEME } from "@/templates/t1/theme";
import type { SiteData } from "@/templates/types";

const displayFont = Outfit({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--t1-font-display" });
const bodyFont = Inter({ subsets: ["latin"], variable: "--t1-font-body" });

export const metadata: Metadata = {
  title: "PTIN-Certified Tax Preparer | Mobile & Virtual Service Available",
  description:
    "Tax service for Atlanta & surrounding states. Mobile & virtual service available. Contact the PTIN-certified tax preparer who sent you to this link.",
};

/** The home page shares Template 1's sections but has no single preparer behind it. */
const HOME_SITE: SiteData = {
  id: null,
  slug: null,
  templateNumber: 1,
  fullName: "Your PTIN-Certified Tax Preparer",
  businessName: "TaxPrep.me",
  email: "",
  phone: "",
  address: "",
  servingArea: "Atlanta & Surrounding States",
  logoUrl: "/site/affordatax-icon.png",
  photoUrl: "/templates/t1/professional.jpg",
};

const NAV = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "FAQ", href: "#faq" },
  { label: "Client Forms", href: "#forms" },
  { label: "Cash Advance", href: "#cash-advance" },
  { label: "Contact", href: "#contact" },
];

const CONTACT_NOTE = "Please contact the tax preparer who sent you to this link";

export default async function Home() {
  const cms = await getTemplateCopy(1);
  const copy = resolveTokens(cms ?? T1_DEFAULT_COPY, {
    fullName: HOME_SITE.fullName,
    businessName: HOME_SITE.businessName,
    servingArea: HOME_SITE.servingArea,
  });
  const props = { site: HOME_SITE, copy };
  const hiree = visibleButtons(copy.headerButtons)[0];

  return (
    <div
      style={T1_THEME}
      className={`${displayFont.variable} ${bodyFont.variable} flex min-h-screen flex-col overflow-x-clip bg-white font-(family-name:--t1-font-body) text-[15px] text-slate-700 antialiased sm:text-base`}
    >
      <header className="sticky top-0 z-40 bg-(--t1-orange) shadow-[0_8px_24px_-16px_rgba(0,0,0,0.5)]">
        <div className={`${container} flex h-16 items-center gap-4`}>
          <Link href="/" className="flex shrink-0 items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-white">
            <Image src={HOME_SITE.logoUrl} alt="" width={36} height={36} className="size-9 rounded-md bg-white p-0.5" priority />
            <span className={`${display} hidden text-lg font-bold text-white sm:inline`}>TaxPrep.me</span>
          </Link>
          <nav aria-label="Main" className="-mx-2 min-w-0 flex-1 overflow-x-auto [scrollbar-width:none]">
            <ul className="flex items-center gap-1 px-2 lg:justify-center">
              {NAV.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="block rounded-full px-3 py-2 text-xs font-bold tracking-wider whitespace-nowrap text-white uppercase transition hover:bg-white/15"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          {hiree && (
            <a
              href={hiree.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden shrink-0 items-center gap-2 rounded-full bg-(--t1-ink) px-5 py-2.5 text-xs font-bold tracking-widest text-white uppercase transition hover:bg-black md:inline-flex"
            >
              <PlayCircle className="size-4" aria-hidden />
              {hiree.label}
            </a>
          )}
        </div>
      </header>

      <main className="flex-1">
        <section id="home" className="relative scroll-mt-16 overflow-hidden bg-(--t1-teal) text-white">
          <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 size-[28rem] rounded-full bg-(--t1-orange)/20 blur-3xl" />
          <div className={`${container} relative grid gap-10 py-16 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:py-24`}>
            <div>
              <p className="font-serif text-xl italic text-(--t1-gold) sm:text-2xl">{copy.hero.eyebrow}</p>
              <h1 className={`${display} mt-4 text-5xl font-bold leading-[1.02] sm:text-7xl`}>Tax Service</h1>
              <p className="mt-6 font-serif text-xl italic text-white/90 sm:text-2xl">
                Servicing {HOME_SITE.servingArea}
                <br />
                {copy.hero.availability}
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <a href="#about" className={btnPrimary}>
                  {copy.hero.ctaLabel}
                  <ArrowRight className={btnArrow} aria-hidden />
                </a>
                <Link href="/intake" className={btnOutlineLight}>
                  Client Forms
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              <div className="relative overflow-hidden rounded-3xl sm:row-span-2 bg-(--t1-gold) p-5 text-(--t1-ink) shadow-xl sm:p-6">
                <Image
                  src="/site/home-hero-notes.jpg"
                  alt="Sticky note: Taxes? Refunds? Need help? Call us!"
                  width={400}
                  height={300}
                  className="-mx-5 -mt-5 mb-5 aspect-[4/3] w-[calc(100%+2.5rem)] max-w-none object-cover sm:-mx-6 sm:-mt-6 sm:w-[calc(100%+3rem)]"
                />
                <ul className="space-y-2 text-sm font-semibold">
                  {copy.highlights.map((h) => (
                    <li key={h} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-(--t1-teal)" aria-hidden />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col justify-center rounded-3xl bg-white p-5 text-center text-xs font-bold tracking-wider text-(--t1-ink) uppercase shadow-xl sm:p-6 sm:text-sm">
                {CONTACT_NOTE}
              </div>
              <div className="overflow-hidden rounded-3xl bg-(--t1-teal-deep) shadow-xl ring-1 ring-white/10">
                <p className={`${display} flex items-center justify-center gap-2 px-4 py-4 text-center text-sm font-bold tracking-wide text-(--t1-gold) uppercase sm:text-base`}>
                  <BadgeCheck className="size-5 shrink-0" aria-hidden />
                  IRS-Certified Tax Preparer
                </p>
                <Image src="/site/home-hero-1040.jpg" alt="Form 1040 with glasses" width={400} height={260} className="aspect-[3/2] w-full object-cover" />
              </div>
            </div>
          </div>
        </section>

        <section id="about" className={`${section} scroll-mt-16`}>
          <div className={`${container} grid gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-center`}>
            <div className="mx-auto w-full max-w-sm rounded-3xl bg-white p-4 shadow-[0_30px_60px_-30px_rgba(7,47,41,0.45)] ring-1 ring-black/5">
              <Image
                src={HOME_SITE.photoUrl}
                alt="PTIN-certified tax preparer"
                width={480}
                height={600}
                className="aspect-[4/5] w-full rounded-2xl object-cover"
              />
            </div>
            <div>
              <h2 className={`${h2} text-(--t1-teal)`}>Please contact your PTIN Certified tax preparer who sent you to this link.</h2>
              <div className="mt-10 grid gap-5 sm:grid-cols-3">
                {copy.intro.cards.map((card, i) => (
                  <p key={i} className="rounded-2xl bg-(--t1-mint) p-5 text-sm leading-relaxed text-slate-700">
                    {card.body}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>

        <Services {...props} />
        <Faq {...props} />
        <ClientForms {...props} />
        <Loans {...props} />

        <section id="contact" className={`${section} scroll-mt-16 text-center`}>
          <div className={container}>
            <h2 className={`${h2} text-(--t1-ink)`}>{copy.cta.heading}</h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-slate-600">
              Schedule a free consultation with the PTIN-certified preparer who sent you to this link, or start with the
              client forms.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link href="/intake" className={btnPrimary}>
                Start with the client forms
                <ArrowRight className={btnArrow} aria-hidden />
              </Link>
              <Link href="/getstarted" className="inline-flex min-h-12 items-center rounded-full px-7 py-3 font-semibold text-(--t1-teal) ring-1 ring-(--t1-teal)/30 transition hover:bg-(--t1-teal) hover:text-white">
                Get a free quote
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
