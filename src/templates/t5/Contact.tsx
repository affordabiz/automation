import type { ReactNode } from "react";
import { ContactForm, type ContactFormStyle } from "../shared/ContactForm";
import type { TemplateProps } from "../types";
import { btnRed, container, label, oswald, telHref } from "./theme";

/** Laptop photo under a steel-blue wash, as on the reference. */
const CONTACT_BG =
  "bg-(--t5-blue) bg-[linear-gradient(180deg,#678297_0%,rgba(103,130,151,0.7)_100%),url('/templates/t5/laptop.jpg')] bg-cover bg-center";
const FOOTER_BG =
  "bg-[#f9f3e8] bg-[linear-gradient(180deg,rgba(249,243,232,0.85)_0%,rgba(249,243,232,0.9)_100%),url('/templates/t5/coins.jpg')] bg-cover bg-center";

const FORM_STYLE: ContactFormStyle = {
  field:
    "w-full rounded-md border-0 bg-white/15 px-4 py-3.5 text-[0.95rem] text-white ring-1 ring-inset ring-white/10 placeholder:text-white/70 focus:bg-white/25 focus:outline-2 focus:outline-white",
  button: `${btnRed} min-w-36`,
  success: "flex flex-col items-center gap-3 rounded-md bg-white/15 p-8 text-center text-lg font-semibold text-white",
  successIcon: "size-10 text-white",
  labels: { name: "Name", email: "Email Address", message: "Message", submit: "Submit" },
};

const SITE_HOME = "https://taxprep.me/";
const BRAND = "TaxPrep.me";

function linkBrand(text: string): ReactNode[] {
  return text.split(BRAND).flatMap((part, i) =>
    i === 0
      ? [part]
      : [
          <a key={i} href={SITE_HOME} target="_blank" rel="noopener noreferrer" className="text-[#2ea3f2] hover:underline">
            {BRAND}
          </a>,
          part,
        ],
  );
}

function Info({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <div>
      <h5 className={`${label} text-(--t5-ink)`}>{heading}</h5>
      <div className="mt-2.5 leading-[1.9] font-bold text-(--t5-slate)">{children}</div>
    </div>
  );
}

export function Contact({ site, copy }: TemplateProps) {
  const [specialty, help, touch, area] = copy.contact.infoHeadings ?? [];
  return (
    <section id="contact" className="scroll-mt-24">
      <div className={CONTACT_BG}>
        <div className="mx-auto grid max-w-[1366px] lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)]">
          <div className="bg-(--t5-yellow) px-5 py-12 sm:px-10 lg:-mt-14 lg:px-[12%] lg:py-16">
            <div className="grid gap-9 sm:grid-cols-2 sm:gap-8">
              {specialty && (
                <Info heading={specialty}>
                  <ul className="list-disc space-y-1.5 pl-5 leading-snug">
                    {copy.highlights.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                </Info>
              )}
              <div className="space-y-8">
                {help && (
                  <Info heading={help}>
                    <p>
                      {site.fullName},
                      <br />
                      {copy.contact.credentialLine}
                    </p>
                  </Info>
                )}
                {touch && (
                  <Info heading={touch}>
                    <a href={telHref(site.phone)} className="block hover:underline">
                      {site.phone}
                    </a>
                    <a href={`mailto:${site.email}`} className="block break-words hover:underline">
                      {site.email}
                    </a>
                  </Info>
                )}
                {area && (
                  <Info heading={area}>
                    <p>{copy.hero.servingLine}</p>
                  </Info>
                )}
              </div>
            </div>
          </div>
          <div className="px-5 py-12 sm:px-10 lg:py-16 lg:pr-[12%] lg:pl-14">
            <h2 className={`${oswald} mb-7 text-[2.6rem] leading-tight font-medium text-white lg:text-5xl`}>{copy.contact.heading}</h2>
            <ContactForm slug={site.slug} styles={FORM_STYLE} />
          </div>
        </div>
      </div>

      <footer className={`${FOOTER_BG} py-8 text-center text-[0.95rem] leading-[1.7] text-[#666]`}>
        <p className={`${container} max-w-4xl`}>
          {linkBrand(copy.footer.text)}{" "}
          {copy.footer.links.map((l, i) => (
            <span key={l.url}>
              {i > 0 && " "}
              <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-[#2ea3f2] hover:underline">
                {l.label}
              </a>
            </span>
          ))}
        </p>
      </footer>
    </section>
  );
}
