import Image from "next/image";
import type { ReactNode } from "react";
import { ContactForm, type ContactFormStyle } from "../shared/ContactForm";
import type { TemplateProps } from "../types";
import { btnNavy, container, display, openSans, telHref } from "./theme";

/** Coins photo under a cream wash; the cream alone shows if the photo is missing. */
const CONTACT_BG =
  "bg-(--t2-cream) bg-[linear-gradient(180deg,rgba(249,243,232,0.85)_0%,rgba(249,243,232,0.9)_100%),url('/templates/t2/coins.jpg')] bg-cover bg-center";

const FORM_STYLE: ContactFormStyle = {
  field:
    "w-full rounded-lg border-0 bg-white px-4 py-4 text-base font-medium text-slate-800 ring-1 ring-inset ring-(--t2-navy)/10 placeholder:text-[#999] focus:outline-2 focus:outline-(--t2-navy) font-(family-name:--t2-font-display)",
  button: `${btnNavy} min-w-36`,
  success: "flex flex-col items-center gap-3 rounded-xl bg-white p-8 text-center text-lg font-bold text-(--t2-navy)",
  successIcon: "size-10 text-(--t2-navy)",
  labels: { name: "Name", email: "Email Address", message: "Message", submit: "Submit" },
};

const SITE_HOME = "https://taxprep.me/";
const BRAND = "TaxPrep.me";

/** Links each "TaxPrep.me" in the footer text, as the reference does. */
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

export function Contact({ site, copy }: TemplateProps) {
  const rows = [
    { label: site.fullName, value: copy.contact.credentialLine, href: null },
    { label: "Serving Areas", value: copy.hero.servingLine, href: null },
    { label: "Email", value: site.email, href: `mailto:${site.email}` },
    { label: "Phone", value: site.phone, href: telHref(site.phone) },
  ];
  return (
    <section id="contact" className={`scroll-mt-20 ${CONTACT_BG}`}>
      <div className={`${container} grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_2fr] lg:gap-[3.5%] lg:py-20`}>
        <div className="mx-auto w-full max-w-60 sm:mx-0">
          <div className="relative aspect-square overflow-hidden rounded-xl border-[5px] border-(--t2-mint) bg-(--t2-mint)">
            <Image unoptimized fill src={site.photoUrl} alt="Tax Preparer Portrait" className="object-cover object-top" sizes="15rem" />
          </div>
        </div>
        <ul className="space-y-7">
          {rows.map(({ label, value, href }) => (
            <li key={label}>
              <h4 className={`${display} text-[1.35rem] leading-tight font-black text-(--t2-navy)`}>{label}</h4>
              {href ? (
                <a href={href} className="mt-2 block break-words text-[#666] transition hover:text-(--t2-navy)">
                  {value}
                </a>
              ) : (
                <p className="mt-2 text-[#666]">{value}</p>
              )}
            </li>
          ))}
        </ul>
        <div className="min-w-0 sm:col-span-2 lg:col-span-1">
          <ContactForm slug={site.slug} styles={FORM_STYLE} />
        </div>
      </div>

      <footer className={`${openSans} border-t border-black/5 py-8 text-center text-[0.95rem] leading-[1.7] font-normal text-[#666]`}>
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
