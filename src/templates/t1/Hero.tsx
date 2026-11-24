import { ArrowRight, BadgeCheck, Check, Mail, MapPin, Phone, Sparkles } from "lucide-react";
import type { TemplateProps } from "../types";
import { btnArrow, btnOutlineLight, btnPrimary, container, display, telHref } from "./theme";

const TILT = ["-rotate-3", "rotate-2", "-rotate-2", "rotate-3"];

export function Hero({ site, copy }: TemplateProps) {
  const { hero, highlights } = copy;
  return (
    <section id="home" className="relative scroll-mt-20 overflow-hidden bg-(--t1-teal) text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -right-48 -top-48 size-[38rem] rounded-full bg-(--t1-orange)/20 blur-3xl" />
        <div className="absolute -bottom-56 -left-40 size-[32rem] rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      </div>

      <div className={`${container} relative grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:py-28`}>
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-(--t1-orange) ring-1 ring-inset ring-white/15 backdrop-blur">
            <Sparkles className="size-4" aria-hidden />
            {hero.eyebrow}
          </p>
          <h1
            className={`${display} mt-6 text-[2.75rem] leading-[1.02] font-extrabold break-words sm:text-6xl lg:text-7xl xl:text-[5.25rem]`}
          >
            {hero.title}
          </h1>
          <p className="mt-6 text-lg font-semibold text-white sm:text-xl">{hero.subtitle}</p>
          <div className="mt-4 space-y-1.5 text-base text-white/75 sm:text-lg">
            <p className="flex items-start gap-2">
              <MapPin className="mt-1 size-4 shrink-0 text-(--t1-orange)" aria-hidden />
              {hero.servingLine}
            </p>
            <p className="flex items-start gap-2">
              <Check className="mt-1 size-4 shrink-0 text-(--t1-orange)" aria-hidden />
              {hero.availability}
            </p>
          </div>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a href="#about" className={btnPrimary}>
              {hero.ctaLabel}
              <ArrowRight className={btnArrow} aria-hidden />
            </a>
            <a href={telHref(site.phone)} className={btnOutlineLight}>
              <Phone className="size-4" aria-hidden />
              {site.phone}
            </a>
          </div>
        </div>

        <aside className="relative min-w-0 rounded-[2rem] bg-white/[0.07] p-6 shadow-2xl ring-1 ring-inset ring-white/15 backdrop-blur-md sm:p-8">
          <div className="flex flex-wrap gap-2.5" aria-hidden>
            {hero.notes.map((n, i) => (
              <span
                key={n}
                className={`${TILT[i % TILT.length]} ${display} rounded-lg bg-(--t1-orange) px-3.5 py-1.5 text-base font-bold text-(--t1-ink) shadow-lg`}
              >
                {n}
              </span>
            ))}
          </div>
          <p className="mt-7 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-(--t1-orange)">
            <BadgeCheck className="size-5 shrink-0" aria-hidden />
            {hero.badge}
          </p>
          <ul className="mt-5 space-y-3 text-[0.95rem] text-white/90">
            {highlights.map((h) => (
              <li key={h} className="flex gap-3">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-(--t1-orange)/20 text-(--t1-orange)">
                  <Check className="size-3.5" strokeWidth={3} aria-hidden />
                </span>
                {h}
              </li>
            ))}
          </ul>
          <div className="mt-7 space-y-3 rounded-2xl bg-(--t1-ink)/60 p-5 text-sm ring-1 ring-inset ring-white/10">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/55">{hero.contactLabel}</p>
            <a href={telHref(site.phone)} className="flex items-center gap-3 font-semibold transition hover:text-(--t1-orange)">
              <Phone className="size-4 shrink-0 text-(--t1-orange)" aria-hidden />
              {site.phone}
            </a>
            <a href={`mailto:${site.email}`} className="flex items-center gap-3 break-all transition hover:text-(--t1-orange)">
              <Mail className="size-4 shrink-0 text-(--t1-orange)" aria-hidden />
              {site.email}
            </a>
            <p className="flex items-start gap-3 text-white/80">
              <MapPin className="mt-0.5 size-4 shrink-0 text-(--t1-orange)" aria-hidden />
              {site.address}
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
