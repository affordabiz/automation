import Image from "next/image";
import { Mail, MapPin, Phone, UserRound } from "lucide-react";
import { ContactForm, type ContactFormStyle } from "../shared/ContactForm";
import type { TemplateProps } from "../types";
import { btnNavy, container, display, section, telHref } from "./theme";

const FORM_STYLE: ContactFormStyle = {
  field:
    "w-full rounded-xl border-0 bg-(--t2-cream) px-4 py-3.5 text-base text-slate-800 ring-1 ring-inset ring-(--t2-navy)/10 transition placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-(--t2-navy) sm:text-[0.95rem]",
  button: btnNavy,
  success:
    "flex flex-col items-center gap-3 rounded-2xl bg-(--t2-mint) p-8 text-center text-lg font-semibold text-(--t2-navy)",
  successIcon: "size-10 text-(--t2-navy)",
  labels: { name: "Name", email: "Email Address", message: "Message", submit: "Submit" },
};

export function Contact({ site, copy }: TemplateProps) {
  const rows = [
    { icon: UserRound, label: site.fullName, value: copy.contact.credentialLine, href: null },
    { icon: MapPin, label: "Serving Areas", value: copy.hero.servingLine, href: null },
    { icon: Mail, label: "Email", value: site.email, href: `mailto:${site.email}` },
    { icon: Phone, label: "Phone", value: site.phone, href: telHref(site.phone) },
  ];
  return (
    <section id="contact" className={`${section} bg-(--t2-cream)`}>
      <div className={`${container} grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14`}>
        <div className="grid gap-8 sm:grid-cols-[auto_1fr] sm:items-start">
          <div className="relative mx-auto w-44 sm:mx-0 sm:w-48 lg:w-52">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] border-[6px] border-(--t2-mint) bg-(--t2-mint) shadow-[0_20px_45px_-20px_rgba(0,0,0,0.35)]">
              <Image
                unoptimized
                fill
                src={site.photoUrl}
                alt={`${site.fullName}, tax preparer`}
                className="object-cover object-top"
                sizes="13rem"
              />
            </div>
          </div>
          <ul className="space-y-5">
            {rows.map(({ icon: Icon, label, value, href }) => (
              <li key={label} className="flex items-start gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-tl-[1.1rem] rounded-br-[1.1rem] rounded-tr-md rounded-bl-md bg-(--t2-navy) text-(--t2-tan)">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h3 className={`${display} text-[1.45rem] leading-none font-black text-(--t2-navy)`}>{label}</h3>
                  {href ? (
                    <a href={href} className="mt-1 block font-medium break-words text-slate-600 transition hover:text-(--t2-navy)">
                      {value}
                    </a>
                  ) : (
                    <p className="mt-1 font-medium break-words text-slate-600">{value}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="min-w-0 rounded-[2rem] bg-white p-6 shadow-[0_30px_70px_-35px_rgba(40,52,68,0.6)] ring-1 ring-(--t2-navy)/5 sm:p-9">
          {copy.contact.heading && (
            <h2 className={`${display} mb-6 text-5xl leading-none font-black text-(--t2-navy)`}>{copy.contact.heading}</h2>
          )}
          <ContactForm slug={site.slug} styles={FORM_STYLE} />
        </div>
      </div>
    </section>
  );
}
