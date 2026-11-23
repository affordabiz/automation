import { Mail, MapPin, Phone } from "lucide-react";
import type { TemplateProps } from "../types";
import { ContactForm } from "./ContactForm";
import { container, display, telHref } from "./theme";

export function Contact({ site, copy }: TemplateProps) {
  return (
    <section id="contact" className="scroll-mt-20 bg-(--t1-teal) py-20 text-white lg:py-28">
      <div className={`${container} grid gap-12 lg:grid-cols-2`}>
        <div>
          <h2 className={`${display} text-4xl font-semibold text-(--t1-orange) sm:text-5xl`}>{copy.contact.heading}</h2>
          <p className="mt-4 text-white/85">{copy.contact.intro}</p>
          <p className="mt-8 font-semibold">{copy.contact.credentialLine}</p>
          <p className="mt-1 text-white/75">{copy.hero.servingLine}</p>
          <ul className="mt-6 space-y-3 text-sm">
            <li>
              <a href={telHref(site.phone)} className="flex items-center gap-3 hover:text-(--t1-orange)">
                <Phone className="size-4" aria-hidden />
                {site.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${site.email}`} className="flex items-center gap-3 break-all hover:text-(--t1-orange)">
                <Mail className="size-4 shrink-0" aria-hidden />
                {site.email}
              </a>
            </li>
            <li className="flex items-start gap-3 text-white/80">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
              {site.address}
            </li>
          </ul>
        </div>
        <div className="rounded-3xl bg-white/[0.06] p-6 ring-1 ring-white/15 sm:p-8">
          <ContactForm slug={site.slug} />
        </div>
      </div>
    </section>
  );
}
