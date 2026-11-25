import { ArrowUpRight, ClipboardCheck, FileSignature, Upload } from "lucide-react";
import type { TemplateProps } from "../types";
import { btnTan, container, display, externalProps, h2 } from "./theme";

const ICONS = [ClipboardCheck, FileSignature];

export function ClientForms({ copy }: TemplateProps) {
  const { forms } = copy;
  return (
    <section id="forms" className="scroll-mt-24 bg-white py-14 sm:py-16 lg:py-20">
      <div className={container}>
        <div className="rounded-2xl bg-(--t2-mint) px-5 py-12 sm:px-10 lg:px-14 lg:py-16">
          <h2 className={`${h2} text-center`}>{forms.heading}</h2>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:mt-12 lg:gap-8">
            {forms.groups.map((g, i) => {
              const Icon = ICONS[i % ICONS.length];
              return (
                <article key={g.heading} className="flex flex-col rounded-2xl bg-white p-6 shadow-[0_18px_40px_-28px_rgba(40,52,68,0.6)] sm:p-8">
                  <div className="flex items-start gap-4 border-b-2 border-(--t2-navy) pb-5">
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-(--t2-navy) text-(--t2-tan)">
                      <Icon className="size-6" aria-hidden />
                    </span>
                    <h3
                      className={`${display} pt-0.5 text-[1.3rem] leading-[1.1] font-black whitespace-pre-line text-(--t2-navy) sm:text-[1.4rem]`}
                    >
                      {g.heading}
                    </h3>
                  </div>
                  <div className="mt-6 flex flex-1 flex-col gap-3">
                    {g.links.map((l) => (
                      <a
                        key={l.label}
                        href={l.url}
                        {...externalProps(l.url)}
                        className={`${display} group flex min-h-14 items-center justify-between gap-4 rounded-xl bg-(--t2-navy) py-3 pr-3 pl-5 text-[1rem] leading-tight font-black tracking-[1.5px] text-white uppercase shadow-[0_10px_22px_-14px_rgba(40,52,68,0.9)] transition duration-200 hover:-translate-y-0.5 hover:bg-(--t2-tan) hover:text-(--t2-navy) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--t2-navy)`}
                      >
                        <span>{l.label}</span>
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/10 text-(--t2-tan) transition group-hover:bg-(--t2-navy) group-hover:text-white">
                          <ArrowUpRight className="size-5" aria-hidden />
                        </span>
                      </a>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-8 flex justify-center lg:mt-10">
            <a
              href={forms.portalLink.url}
              {...externalProps(forms.portalLink.url)}
              className={`${btnTan} w-full sm:w-auto sm:min-w-[24rem]`}
            >
              <Upload className="size-5 shrink-0" aria-hidden />
              {forms.portalLink.label}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
