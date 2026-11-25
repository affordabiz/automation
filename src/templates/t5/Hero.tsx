import Image from "next/image";
import type { TemplateProps } from "../types";
import { BookingForm } from "./BookingForm";
import { label, oswald, telHref } from "./theme";

/** Laptop photo fading to white from the left, as on the reference. */
const HERO_BG =
  "bg-white bg-[linear-gradient(125deg,#ffffff_15%,rgba(255,255,255,0)_70%),url('/templates/t5/laptop.jpg')] bg-cover bg-left-bottom";

export function Hero({ site, copy }: TemplateProps) {
  const { hero } = copy;
  return (
    <section id="home" className={`scroll-mt-24 ${HERO_BG}`}>
      <div className="mx-auto grid max-w-[1366px] lg:grid-cols-[1.12fr_1fr]">
        <div className="flex flex-col items-start px-5 pt-12 pb-14 sm:px-10 lg:pt-14 lg:pr-10 lg:pb-20 lg:pl-[10%]">
          <span className="border-[5px] border-[#333] bg-white p-1">
            <Image unoptimized priority src={site.photoUrl} alt={site.fullName} width={120} height={120} className="size-24 rounded-full object-cover sm:size-28" />
          </span>
          <h1
            className={`${oswald} mt-5 max-w-xl text-[3.4rem] leading-[1.08] font-medium text-balance break-words text-(--t5-blue) sm:text-7xl lg:text-[6.25rem] lg:leading-[1.15]`}
          >
            {hero.title}
          </h1>
          <a
            href="#services"
            className="mt-6 inline-block max-w-full rounded-md bg-(--t5-yellow) px-6 py-4 text-[0.8rem] leading-[1.9] font-semibold tracking-[3px] text-(--t5-ink) uppercase shadow-[0_12px_26px_-14px_rgba(224,153,0,0.9)] transition hover:-translate-y-0.5 hover:bg-(--t5-red) hover:text-white sm:text-[0.95rem]"
          >
            {hero.subtitle}
          </a>
          <a href={telHref(site.phone)} className={`${oswald} mt-7 text-4xl leading-none text-(--t5-red) drop-shadow-[0_1px_0_rgba(255,255,255,0.8)] transition hover:text-(--t5-red-deep) sm:text-[2.9rem]`}>
            {site.phone}
          </a>
        </div>

        <div className="flex flex-col lg:pt-14">
          <div className="grid gap-6 bg-(--t5-slate) px-5 py-8 sm:grid-cols-2 sm:px-10 lg:px-[10%]">
            <div>
              <h5 className={`${label} text-(--t5-yellow)`}>{site.fullName},</h5>
              <p className="mt-2 font-bold text-white">{hero.badge}</p>
            </div>
            <div className="min-w-0">
              <h5 className={`${label} text-(--t5-yellow)`}>{hero.contactLabel}</h5>
              <a href={`mailto:${site.email}`} className="mt-2 block font-bold break-words text-white hover:underline">
                {site.email}
              </a>
            </div>
          </div>
          <div className="flex-1 bg-(--t5-yellow) px-5 py-10 sm:px-10 lg:px-[10%] lg:py-12">
            <h2 className={`${oswald} mb-7 text-[2.4rem] leading-[1.15] font-medium text-(--t5-slate) lg:text-5xl`}>{copy.booking?.heading}</h2>
            <BookingForm slug={site.slug} services={copy.services.items.map((s) => s.title)} />
          </div>
        </div>
      </div>
    </section>
  );
}
