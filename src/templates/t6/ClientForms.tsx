import Image from "next/image";
import { ArrowRight, Upload } from "lucide-react";
import type { TemplateProps } from "../types";
import { btnAccent, btnArrow, container, externalProps, head, section, type Variant } from "./variant";

export function ClientForms({ copy, v }: TemplateProps & { v: Variant }) {
  const { forms } = copy;
  return (
    <section id="forms" className={`${section} ${v.dark.forms ? "bg-(--x-dark)" : "bg-white"}`}>
      <div className={container}>
        <div className="rounded-3xl bg-white px-5 py-10 shadow-[0_30px_70px_-40px_rgba(0,0,0,0.9)] sm:px-10 lg:px-14 lg:py-14">
          <div className="text-center">
            <h2 className={`${head} text-[2.4rem] leading-tight font-bold text-[#111] sm:text-5xl`}>{forms.heading}</h2>
            <span aria-hidden className="mx-auto mt-4 block h-1 w-24 rounded-full bg-(--x-accent)" />
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {forms.groups.map((g, i) => (
              <article key={g.heading} className="flex flex-col items-center rounded-2xl bg-[#f6f7f8] p-6 text-center ring-1 ring-black/5 sm:p-8">
                <Image unoptimized src={v.formIcons[i % v.formIcons.length]} alt="" width={56} height={56} className="size-12" />
                <h3 className={`${head} mt-5 text-xl leading-snug font-semibold whitespace-pre-line text-[#111]`}>{g.heading}</h3>
                <div className="mt-6 flex w-full flex-col gap-3">
                  {g.links.map((l) => (
                    <a key={l.label} href={l.url} {...externalProps(l.url)} className={`${btnAccent} w-full justify-between! text-left`}>
                      {l.label}
                      <ArrowRight className={`${btnArrow} shrink-0`} aria-hidden />
                    </a>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="mt-6 flex justify-center rounded-2xl border border-dashed border-black/15 px-5 py-6">
            <a href={forms.portalLink.url} {...externalProps(forms.portalLink.url)} className={`${btnAccent} w-full sm:w-auto`}>
              <Upload className="size-4" aria-hidden />
              {forms.portalLink.label}
              <ArrowRight className={btnArrow} aria-hidden />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
