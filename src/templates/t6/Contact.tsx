import Image from "next/image";
import type { ReactNode } from "react";
import { ArrowRight, Mail, MapPin, Phone, UserRound } from "lucide-react";
import { ContactForm, type ContactFormStyle } from "../shared/ContactForm";
import type { TemplateProps } from "../types";
import { btnAccent, btnArrow, btnDark, container, head, section, telHref, type Variant } from "./variant";

const FORM_STYLE: ContactFormStyle = {
  field:
    "w-full rounded-lg border-0 bg-[#f4f5f7] px-4 py-3.5 text-base text-[#222] ring-1 ring-inset ring-black/10 transition placeholder:text-[#777] focus:bg-white focus:outline-2 focus:outline-(--x-accent)",
  button: btnAccent,
  success: "flex flex-col items-center gap-3 rounded-xl bg-(--x-light) p-8 text-center text-lg font-semibold text-[#111]",
  successIcon: "size-10 text-(--x-accent)",
};

const BRAND = "TaxPrep.me";

function linkBrand(text: string): ReactNode[] {
  return text.split(BRAND).flatMap((part, i) =>
    i === 0
      ? [part]
      : [
          <a key={i} href="https://taxprep.me/" target="_blank" rel="noopener noreferrer" className="text-[#2ea3f2] hover:underline">
            {BRAND}
          </a>,
          part,
        ],
  );
}

/** "Ready To Get Started?" band with the reference's illustrations (Template 6). */
export function Cta({ copy }: TemplateProps) {
  if (!copy.cta.heading) return null;
  return (
    <section className="relative overflow-hidden bg-white pt-16 sm:pt-20 lg:min-h-[23rem]">
      <Image unoptimized src="/templates/t6/person-right.png" alt="" width={260} height={640} className="pointer-events-none absolute bottom-0 left-[3%] hidden h-[20rem] w-auto lg:block" />
      <Image unoptimized src="/templates/t6/person-left.png" alt="" width={270} height={640} className="pointer-events-none absolute right-[3%] bottom-0 hidden h-[20rem] w-auto lg:block" />
      <div className={`${container} relative pb-16 text-center sm:pb-20 lg:pt-16 lg:pb-24`}>
        <h2 className={`${head} text-[2.2rem] leading-tight font-bold text-(--x-accent-deep) sm:text-5xl`}>{copy.cta.heading}</h2>
        {copy.cta.buttonLabel && (
          <a href="#contact" className={`${btnDark} mt-8`}>
            {copy.cta.buttonLabel}
            <ArrowRight className={btnArrow} aria-hidden />
          </a>
        )}
      </div>
    </section>
  );
}

export function Contact({ site, copy, v }: TemplateProps & { v: Variant }) {
  const { contact } = copy;
  const rows = [
    { icon: UserRound, text: contact.credentialLine, href: null },
    { icon: MapPin, text: contact.servingLine ?? "", href: null },
    { icon: Phone, text: site.phone, href: telHref(site.phone) },
    { icon: Mail, text: site.email, href: `mailto:${site.email}` },
  ].filter((r) => r.text);
  return (
    <>
      <section id="contact" className={`${section} ${v.id === "t6" ? "bg-white pt-0!" : "bg-[#f4f6f8]"}`}>
        <div className={container}>
          <div className="grid gap-10 rounded-3xl bg-white p-6 shadow-[0_30px_70px_-40px_rgba(0,0,0,0.6)] ring-1 ring-black/5 sm:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14 lg:p-14">
            <div>
              <h2 className={`${head} text-[2.4rem] leading-tight font-bold text-(--x-head-light) sm:text-5xl`}>{contact.heading}</h2>
              <span aria-hidden className="mt-4 block h-1 w-20 rounded-full bg-(--x-accent)" />
              <p className="mt-6 leading-relaxed text-[#444]">{contact.intro}</p>
              <ul className="mt-8 space-y-4">
                {rows.map(({ icon: Icon, text, href }) => (
                  <li key={text} className="flex items-start gap-3.5">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-(--x-light) text-(--x-accent-deep)">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    {href ? (
                      <a href={href} className="pt-2 font-semibold break-words text-[#222] transition hover:text-(--x-accent-deep)">
                        {text}
                      </a>
                    ) : (
                      <p className="pt-2 font-semibold text-[#222]">{text}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div className="min-w-0">
              <ContactForm slug={site.slug} styles={FORM_STYLE} />
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-black/5 bg-white py-8 text-center text-sm leading-[1.8] text-[#666]">
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
    </>
  );
}
