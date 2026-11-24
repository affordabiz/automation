import { BadgeCheck, Mail, MapPin, Phone } from "lucide-react";
import type { TemplateProps } from "../types";
import { ContactForm } from "./ContactForm";
import { container, h2, section, telHref } from "./theme";

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
          <ContactForm slug={site.slug} />
        </div>
      </div>
    </section>
  );
}
