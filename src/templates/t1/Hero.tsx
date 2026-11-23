import { BadgeCheck, Check, Mail, MapPin, Phone } from "lucide-react";
import type { TemplateProps } from "../types";
import { btnOutlineLight, btnPrimary, container, display, telHref } from "./theme";

const TILT = ["-rotate-3", "rotate-2", "-rotate-1", "rotate-3"];

export function Hero({ site, copy }: TemplateProps) {
  const { hero, highlights } = copy;
  return (
    <section id="home" className="relative scroll-mt-20 overflow-hidden bg-(--t1-teal) text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-40 size-[34rem] rounded-full bg-(--t1-orange)/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-48 -left-32 size-[28rem] rounded-full bg-white/5 blur-3xl"
      />
      <div className={`${container} relative grid gap-12 py-20 lg:grid-cols-[1.2fr_0.8fr] lg:py-28`}>
        <div className="flex flex-col justify-center">
          <p className={`${display} text-2xl italic text-(--t1-orange)`}>{hero.eyebrow}</p>
          <h1 className={`${display} mt-4 text-5xl font-semibold italic leading-[1.05] sm:text-6xl lg:text-7xl`}>
            {hero.title}
          </h1>
          <p className="mt-6 text-lg font-medium text-white/90">{hero.subtitle}</p>
          <p className="mt-3 text-white/75">
            {hero.servingLine}
            <br />
            {hero.availability}
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <a href="#about" className={btnPrimary}>
              {hero.ctaLabel}
            </a>
            <a href={telHref(site.phone)} className={btnOutlineLight}>
              <Phone className="size-4" aria-hidden />
              {site.phone}
            </a>
          </div>
        </div>

        <aside className="rounded-3xl bg-white/[0.06] p-6 ring-1 ring-white/15 backdrop-blur sm:p-8">
          <div className="flex flex-wrap gap-2" aria-hidden>
            {hero.notes.map((n, i) => (
              <span
                key={n}
                className={`${TILT[i % TILT.length]} rounded-md bg-(--t1-orange) px-3 py-1.5 text-sm font-bold text-(--t1-teal-deep) shadow`}
              >
                {n}
              </span>
            ))}
          </div>
          <p className="mt-6 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-(--t1-orange)">
            <BadgeCheck className="size-5" aria-hidden />
            {hero.badge}
          </p>
          <ul className="mt-5 space-y-2.5 text-sm text-white/90">
            {highlights.map((h) => (
              <li key={h} className="flex gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-(--t1-orange)" aria-hidden />
                {h}
              </li>
            ))}
          </ul>
          <div className="mt-6 space-y-2 rounded-2xl bg-(--t1-teal-deep) p-5 text-sm">
            <p className="font-semibold uppercase tracking-wider text-white/60">{hero.contactLabel}</p>
            <a href={telHref(site.phone)} className="flex items-center gap-2 hover:text-(--t1-orange)">
              <Phone className="size-4" aria-hidden />
              {site.phone}
            </a>
            <a href={`mailto:${site.email}`} className="flex items-center gap-2 break-all hover:text-(--t1-orange)">
              <Mail className="size-4 shrink-0" aria-hidden />
              {site.email}
            </a>
            <p className="flex items-start gap-2 text-white/80">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
              {site.address}
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
