import { ArrowRight, ClipboardList, FileClock, FilePen } from "lucide-react";
import type { TemplateProps } from "../types";
import { btnArrow, btnPrimary, container, display, h2, section } from "./theme";

const ICONS = [ClipboardList, FilePen, FileClock];

export function Services({ copy }: TemplateProps) {
  return (
    <section id="services" className={`${section} bg-(--t1-mint)`}>
      <div className={container}>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h2 className={`${h2} text-(--t1-teal)`}>{copy.services.heading}</h2>
            <p className="mt-5 leading-relaxed text-slate-600">{copy.highlights.join(" | ")}</p>
          </div>
          <a href="#contact" className={`${btnPrimary} self-start lg:shrink-0 lg:self-auto`}>
            {copy.services.ctaLabel}
            <ArrowRight className={btnArrow} aria-hidden />
          </a>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:mt-16 lg:grid-cols-3">
          {copy.services.items.map((item, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <article
                key={item.title}
                className="group relative overflow-hidden rounded-3xl bg-white p-7 shadow-sm ring-1 ring-black/5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_-24px_rgba(7,47,41,0.4)] sm:p-8 md:last:col-span-2 lg:last:col-span-1"
              >
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-(--t1-orange) transition-transform duration-500 group-hover:scale-x-100"
                />
                <span className="grid size-14 place-items-center rounded-2xl bg-(--t1-mint) text-(--t1-teal) transition group-hover:bg-(--t1-teal) group-hover:text-white">
                  <Icon className="size-7" aria-hidden />
                </span>
                <h3 className={`${display} mt-6 text-2xl font-bold text-(--t1-ink) sm:text-[1.65rem]`}>{item.title}</h3>
                <p className="mt-3 leading-relaxed text-slate-600">{item.body}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
