import { ArrowRight, Phone } from "lucide-react";
import type { TemplateProps } from "../types";
import { btnArrow, btnOutlineTeal, btnPrimary, container, h2, telHref } from "./theme";

export function Cta({ site, copy }: TemplateProps) {
  return (
    <section className="bg-white py-16 sm:py-20 lg:py-24">
      <div className={container}>
        <div className="relative overflow-hidden rounded-[2rem] bg-(--t1-mint) px-6 py-14 text-center sm:px-12 lg:py-20">
          <div aria-hidden className="absolute -right-24 -top-24 size-72 rounded-full bg-(--t1-orange)/15 blur-2xl" />
          <div aria-hidden className="absolute -bottom-24 -left-24 size-72 rounded-full bg-(--t1-teal)/10 blur-2xl" />
          <h2 className={`${h2} relative text-(--t1-ink)`}>{copy.cta.heading}</h2>
          <div className="relative mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="#contact" className={btnPrimary}>
              {copy.cta.buttonLabel}
              <ArrowRight className={btnArrow} aria-hidden />
            </a>
            <a href={telHref(site.phone)} className={btnOutlineTeal}>
              <Phone className="size-4" aria-hidden />
              {site.phone}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
