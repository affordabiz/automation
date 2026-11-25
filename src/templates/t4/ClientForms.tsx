import { ArrowUpRight, Upload } from "lucide-react";
import type { TemplateProps } from "../types";
import { btnNavy, container, display, externalProps, h2 } from "./theme";

export function ClientForms({ copy }: TemplateProps) {
  const { forms } = copy;
  return (
    <section id="forms" className="scroll-mt-24 bg-white py-14 sm:py-16 lg:py-20">
      <div className={container}>
        <div className="overflow-hidden rounded-2xl shadow-[0_24px_60px_-40px_rgba(0,0,0,0.6)]">
          <div className="bg-(--t4-cyan) px-5 py-6 lg:py-7">
            <h2 className={`${h2} text-center text-white`}>{forms.heading}</h2>
          </div>

          <div className="grid gap-10 bg-(--t4-grey) px-5 py-10 sm:px-10 md:grid-cols-2 md:gap-12 lg:px-14 lg:py-12">
            {forms.groups.map((g) => (
              <div key={g.heading} className="flex flex-col">
                <h3
                  className={`${display} border-b-2 border-[#333] pb-5 text-center text-[1.2rem] leading-[1.6] font-normal whitespace-pre-line text-[#283444]`}
                >
                  {g.heading}
                </h3>
                <div className="mt-6 flex flex-col gap-3">
                  {g.links.map((l) => (
                    <a
                      key={l.label}
                      href={l.url}
                      {...externalProps(l.url)}
                      className={`${display} group flex min-h-14 items-center justify-between gap-4 rounded-xl bg-(--t4-cyan) py-3 pr-3 pl-5 text-[0.95rem] leading-tight font-semibold tracking-[1.5px] text-white uppercase shadow-[0_10px_22px_-14px_rgba(0,0,0,0.6)] transition duration-200 hover:-translate-y-0.5 hover:bg-(--t4-crimson) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`}
                    >
                      <span>{l.label}</span>
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/20 transition group-hover:bg-white group-hover:text-(--t4-crimson)">
                        <ArrowUpRight className="size-5" aria-hidden />
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center bg-(--t4-mint) px-5 py-7">
            <a href={forms.portalLink.url} {...externalProps(forms.portalLink.url)} className={`${btnNavy} w-full sm:w-auto sm:min-w-[24rem]`}>
              <Upload className="size-5 shrink-0" aria-hidden />
              {forms.portalLink.label}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
