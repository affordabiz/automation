import { ClipboardList, FileClock, FilePen } from "lucide-react";
import type { TemplateProps } from "../types";
import { btnPrimary, container, display } from "./theme";

const ICONS = [ClipboardList, FilePen, FileClock];

export function Services({ copy }: TemplateProps) {
  return (
    <section id="services" className="scroll-mt-20 bg-(--t1-mint) py-20 lg:py-28">
      <div className={container}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h2 className={`${display} text-4xl font-semibold text-(--t1-teal) sm:text-5xl`}>{copy.services.heading}</h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">{copy.highlights.join(" | ")}</p>
          </div>
          <a href="#contact" className={`${btnPrimary} self-start lg:self-auto`}>
            {copy.services.ctaLabel}
          </a>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {copy.services.items.map((item, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <article
                key={item.title}
                className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <Icon className="size-9 text-(--t1-teal)" aria-hidden />
                <h3 className={`${display} mt-5 text-2xl font-semibold text-(--t1-teal)`}>{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.body}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
