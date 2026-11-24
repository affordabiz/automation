import { ArrowUpRight, ClipboardCheck, FilePen, Upload } from "lucide-react";
import type { TemplateProps } from "../types";
import { btnArrow, btnNavy, container, display, externalProps, h2, section } from "./theme";

const ICONS = [ClipboardCheck, FilePen];

export function ClientForms({ copy }: TemplateProps) {
  const { forms } = copy;
  return (
    <section id="forms" className={`${section} bg-(--t2-cream)`}>
      <div className={container}>
        <div className="rounded-[2rem] bg-(--t2-mint) px-5 py-14 sm:px-10 lg:px-14 lg:py-20">
          <h2 className={`${h2} text-center text-(--t2-navy)`}>{forms.heading}</h2>
          <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2">
            {forms.groups.map((g, i) => {
              const Icon = ICONS[i % ICONS.length];
              return (
                <article key={g.heading} className="flex flex-col rounded-3xl bg-white p-7 shadow-sm sm:p-9">
                  <span className="grid size-14 place-items-center rounded-tl-[1.5rem] rounded-br-[1.5rem] rounded-tr-md rounded-bl-md bg-(--t2-navy) text-(--t2-tan)">
                    <Icon className="size-7" aria-hidden />
                  </span>
                  <h3
                    className={`${display} mt-6 border-b-2 border-(--t2-navy) pb-4 text-[1.7rem] leading-[1.05] font-black text-(--t2-navy)`}
                  >
                    {g.heading}
                  </h3>
                  <div className="mt-7 flex flex-1 flex-col justify-end gap-3">
                    {g.links.map((l) => (
                      <a
                        key={l.label}
                        href={l.url}
                        {...externalProps(l.url)}
                        className="group flex min-h-14 items-center justify-between gap-3 rounded-2xl bg-(--t2-navy) px-5 py-3 text-sm font-bold tracking-[0.08em] text-white uppercase shadow-[0_12px_26px_-16px_rgba(40,52,68,0.9)] transition duration-200 hover:-translate-y-0.5 hover:bg-(--t2-navy-deep) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--t2-navy)"
                      >
                        {l.label}
                        <ArrowUpRight
                          className="size-5 shrink-0 text-(--t2-tan) transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                          aria-hidden
                        />
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
              className={`${btnNavy} w-full max-w-xl min-h-14! font-bold tracking-[0.08em] uppercase`}
            >
              <Upload className="size-5 text-(--t2-tan)" aria-hidden />
              {forms.portalLink.label}
              <ArrowUpRight className={btnArrow} aria-hidden />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
