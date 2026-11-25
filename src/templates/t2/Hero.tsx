import type { TemplateProps } from "../types";
import { slab } from "./theme";

/** Hero photo with the reference's sage fade; falls back to the fade alone if the photo is missing. */
const HERO_BG =
  "bg-(--t2-sage) bg-[linear-gradient(180deg,#9fa8a3_0%,rgba(159,168,163,0.25)_100%),url('/templates/t2/hero.jpg')] bg-cover bg-center";

export function Hero({ copy }: TemplateProps) {
  const { hero } = copy;
  return (
    <section id="home" className={`relative scroll-mt-20 ${HERO_BG}`}>
      <div className="relative z-20 mx-auto flex max-w-6xl flex-col items-center px-5 pt-16 pb-[5.5rem] text-center sm:pt-20 lg:pt-24">
        <h1
          className={`${slab} text-[3.1rem] leading-[0.92] font-bold text-balance break-words text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.12)] sm:text-7xl lg:text-[6.6rem] xl:text-[8.25rem]`}
        >
          {hero.title}
        </h1>
        <a
          href="#contact"
          className={`${slab} mt-8 inline-block max-w-full rounded-lg bg-(--t2-grey) px-6 py-4 text-base text-white shadow-[0_12px_28px_-14px_rgba(0,0,0,0.6)] transition hover:bg-[#5f5f5f] sm:px-12 sm:text-xl lg:mt-10`}
        >
          {hero.subtitle}
        </a>
      </div>
    </section>
  );
}
