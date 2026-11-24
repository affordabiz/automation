import { ArrowUpRight, ClipboardCheck, FilePen, Upload } from "lucide-react";
import type { TemplateProps } from "../types";
import { btnArrow, btnTeal, container, display, externalProps, h2, section } from "./theme";

const ICONS = [ClipboardCheck, FilePen];

export function ClientForms({ copy }: TemplateProps) {
  const { forms } = copy;
  return (
    <section id="forms" className={`${section} bg-(--t1-mint)`}>
      <div className={container}>
        <h2 className={`${h2} text-center text-(--t1-teal)`}>{forms.heading}</h2>
        <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2 lg:mt-16">
          {forms.groups.map((g, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <article key={g.heading} className="flex flex-col rounded-3xl bg-white p-7 shadow-sm ring-1 ring-black/5 sm:p-9">
                <span className="grid size-14 place-items-center rounded-2xl bg-(--t1-teal) text-white">
                  <Icon className="size-7" aria-hidden />
                </span>
                <h3 className={`${display} mt-6 text-xl font-bold leading-snug text-(--t1-ink) sm:text-2xl`}>{g.heading}</h3>
                <div className="mt-7 flex flex-1 flex-col justify-end gap-3">
                  {g.links.map((l) => (
                    <a
                      key={l.label}
                      href={l.url}
                      {...externalProps(l.url)}
                      className="group flex min-h-14 items-center justify-between gap-3 rounded-2xl bg-(--t1-orange) px-5 py-3 font-semibold text-white shadow-[0_10px_24px_-12px_rgba(247,147,30,0.9)] transition duration-200 hover:-translate-y-0.5 hover:bg-(--t1-orange-deep) hover:shadow-[0_14px_28px_-12px_rgba(224,123,0,0.9)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--t1-orange)"
                    >
                      {l.label}
                      <ArrowUpRight className="size-5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                    </a>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
        <div className="mt-8 flex justify-center">
          <a
            href={forms.portalLink.url}
            {...externalProps(forms.portalLink.url)}
            className={`${btnTeal} w-full max-w-xl min-h-14! text-base!`}
          >
            <Upload className="size-5" aria-hidden />
            {forms.portalLink.label}
            <ArrowUpRight className={btnArrow} aria-hidden />
          </a>
        </div>
      </div>
    </section>
  );
}
