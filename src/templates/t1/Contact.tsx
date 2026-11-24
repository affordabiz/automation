import { BadgeCheck, Mail, MapPin, Phone } from "lucide-react";
import type { TemplateProps } from "../types";
import { ContactForm, type ContactFormStyle } from "../shared/ContactForm";
import { btnPrimary, container, h2, section, telHref } from "./theme";

const FORM_STYLE: ContactFormStyle = {
  field:
    "w-full rounded-xl border-0 bg-slate-50 px-4 py-3.5 text-base text-slate-800 ring-1 ring-inset ring-slate-200 transition placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-(--t1-orange) sm:text-[0.95rem]",
  button: btnPrimary,
  success:
    "flex flex-col items-center gap-3 rounded-2xl bg-(--t1-mint) p-8 text-center text-lg font-semibold text-(--t1-teal)",
  successIcon: "size-10 text-(--t1-orange)",
};

export function Contact({ site, copy }: TemplateProps) {
  const rows = [
    { icon: Phone, label: site.phone, href: telHref(site.phone) },
    { icon: Mail, label: site.email, href: `mailto:${site.email}` },
    { icon: MapPin, label: site.address, href: null },
  ];
  return (
    <section id="contact" className={`${section} relative overflow-hidden bg-(--t1-teal) text-white`}>
      <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 size-[32rem] rounded-full bg-(--t1-orange)/15 blur-3xl" />
      <div className={`${container} relative grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16`}>
        <div className="min-w-0">
          <h2 className={`${h2} text-(--t1-orange)`}>{copy.contact.heading}</h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-white/85">{copy.contact.intro}</p>
          <div className="mt-9 flex items-start gap-3">
            <BadgeCheck className="mt-0.5 size-6 shrink-0 text-(--t1-orange)" aria-hidden />
            <div>
              <p className="text-lg font-semibold">{copy.contact.credentialLine}</p>
              <p className="mt-1 text-white/70">{copy.hero.servingLine}</p>
            </div>
          </div>
          <ul className="mt-8 space-y-3">
            {rows.map(({ icon: Icon, label, href }) => {
              const inner = (
                <>
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/10 text-(--t1-orange) transition group-hover:bg-(--t1-orange) group-hover:text-white">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0 break-words">{label}</span>
                </>
              );
              return (
                <li key={label}>
                  {href ? (
                    <a href={href} className="group flex items-center gap-4 font-medium transition hover:text-(--t1-orange)">
                      {inner}
                    </a>
                  ) : (
                    <p className="group flex items-center gap-4 text-white/85">{inner}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
        <div className="min-w-0 rounded-[2rem] bg-white p-6 text-slate-800 shadow-2xl sm:p-9">
          <ContactForm slug={site.slug} styles={FORM_STYLE} />
        </div>
      </div>
    </section>
  );
}
