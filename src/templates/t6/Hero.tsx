import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { TemplateProps } from "../types";
import { btnAccent, btnArrow, container, head, type Variant } from "./variant";

export function Hero({ site, copy, v }: TemplateProps & { v: Variant }) {
  const { hero } = copy;
  const serving = [hero.servingLine, hero.availability].filter(Boolean).join(" ");

  if (v.hero === "centered") {
    return (
      <section
        id="home"
        className="relative scroll-mt-24 bg-(--x-dark) bg-[linear-gradient(180deg,rgba(20,26,60,0.82),rgba(20,26,60,0.9)),url('/templates/t7/hero.jpg')] bg-cover bg-center text-white"
      >
        <div className={`${container} flex flex-col items-center pt-14 pb-32 text-center sm:pt-16 lg:pb-36`}>
          <div className="relative size-40 overflow-hidden rounded-2xl border-4 border-white/90 shadow-2xl sm:size-44">
            <Image unoptimized priority fill src={site.photoUrl} alt={site.fullName} className="object-cover object-top" sizes="11rem" />
          </div>
          <p className="mt-7 text-lg font-medium text-white/90 sm:text-xl">{hero.subtitle}</p>
          <h1 className={`${head} mt-2 text-[2.9rem] leading-[1.05] font-semibold text-balance sm:text-6xl lg:text-7xl`}>{hero.title}</h1>
          <p className="mt-4 max-w-xl text-base text-white/85 sm:text-lg">{serving}</p>
          {hero.ctaLabel && (
            <a href="#services" className={`${btnAccent} mt-8`}>
              {hero.ctaLabel}
              <ArrowRight className={btnArrow} aria-hidden />
            </a>
          )}
        </div>
      </section>
    );
  }

  return (
    <section id="home" className="relative scroll-mt-24 overflow-hidden bg-(--x-dark) text-white">
      <div aria-hidden className="pointer-events-none absolute -top-40 -right-40 size-[32rem] rounded-full bg-(--x-accent)/10 blur-3xl" />
      <div className={`${container} relative grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:py-24`}>
        <div className="min-w-0">
          <p className={`${head} text-2xl leading-snug font-semibold whitespace-pre-line sm:text-[1.9rem]`}>{hero.subtitle}</p>
          {hero.eyebrow && (
            <p className="mt-5 inline-flex rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-(--x-accent) ring-1 ring-inset ring-white/15 sm:text-base">
              {hero.eyebrow}
            </p>
          )}
          <h1 className={`${head} mt-5 text-[3rem] leading-[1.02] font-bold text-balance break-words text-(--x-accent) sm:text-6xl lg:text-[4.6rem]`}>
            {hero.title}
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">{serving}</p>
          {hero.ctaLabel && (
            <a href="#services" className={`${btnAccent} mt-9`}>
              {hero.ctaLabel}
              <ArrowRight className={btnArrow} aria-hidden />
            </a>
          )}
        </div>
        <div className="relative mx-auto w-full max-w-sm pr-5 pb-5 lg:max-w-md">
          <div aria-hidden className="absolute right-0 bottom-0 h-[92%] w-[88%] rounded-3xl border-2 border-(--x-accent)" />
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-white/5 shadow-[0_30px_60px_-25px_rgba(0,0,0,0.8)]">
            <Image unoptimized priority fill src={site.photoUrl} alt={site.fullName} className="object-cover object-top" sizes="(min-width: 1024px) 28rem, 90vw" />
          </div>
        </div>
      </div>
    </section>
  );
}
