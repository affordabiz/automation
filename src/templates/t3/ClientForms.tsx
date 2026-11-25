import Image from "next/image";
import { ArrowUpRight, Upload } from "lucide-react";
import type { TemplateProps } from "../types";
import { btnNavy, container, externalProps, h2, oswald, section } from "./theme";

const CARDS = [
  { bg: "bg-(--t3-blue)", icon: "/templates/t3/icon-documents.png" },
  { bg: "bg-(--t3-mauve)", icon: "/templates/t3/icon-compliance.png" },
];

export function ClientForms({ copy }: TemplateProps) {
  const { forms } = copy;
  return (
    <section id="forms" className={`${section} bg-white pt-4! sm:pt-6! lg:pt-8!`}>
      <div className={container}>
        <h2 className={`${h2} text-center`}>{forms.heading}</h2>
        <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2 lg:gap-8">
          {forms.groups.map((g, i) => {
            const { bg, icon } = CARDS[i % CARDS.length];
            return (
              <article key={g.heading} className={`flex flex-col items-center rounded-xl px-6 py-10 text-center text-white sm:px-10 ${bg}`}>
                <Image unoptimized src={icon} alt="" width={120} height={120} className="size-24" />
                <h3 className={`${oswald} mt-6 max-w-sm text-lg leading-snug font-semibold tracking-[0.5px] uppercase`}>{g.heading}</h3>
                <div className="mt-7 flex w-full flex-col items-stretch gap-3 sm:px-4">
                  {g.links.map((l) => (
                    <a
                      key={l.label}
                      href={l.url}
                      {...externalProps(l.url)}
                      className="group flex min-h-12 items-center justify-between gap-3 rounded-md bg-white/15 py-2.5 pr-2.5 pl-5 text-left text-[0.78rem] leading-snug font-semibold tracking-[2.5px] uppercase ring-1 ring-inset ring-white/20 transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:text-(--t3-ink) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:text-[0.82rem]"
                    >
                      <span>{l.label}</span>
                      <span className="grid size-8 shrink-0 place-items-center rounded bg-white/15 transition group-hover:bg-(--t3-red) group-hover:text-white">
                        <ArrowUpRight className="size-4" aria-hidden />
                      </span>
                    </a>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
        <div className="mx-auto mt-6 flex max-w-4xl justify-center rounded-xl bg-(--t3-mint) px-5 py-7 lg:mt-8">
          <a href={forms.portalLink.url} {...externalProps(forms.portalLink.url)} className={`${btnNavy} w-full sm:w-auto`}>
            <Upload className="size-4" aria-hidden />
            {forms.portalLink.label}
          </a>
        </div>
      </div>
    </section>
  );
}
