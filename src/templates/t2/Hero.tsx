import type { TemplateProps } from "../types";
import { btnNavy, container, display } from "./theme";

export function Hero({ copy }: TemplateProps) {
  const { hero } = copy;
  return (
    <section id="home" className="relative scroll-mt-20 overflow-hidden bg-(--t2-sage) text-(--t2-navy)">
      {/* Layered sage wash with soft contour rings, echoing the reference's photo background. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#9fa8a3_0%,#c5d5cb_55%,#f9f3e8_100%)]" />
        <div className="absolute -right-40 -top-40 size-[44rem] rounded-full bg-[repeating-radial-gradient(circle,transparent_0_38px,rgba(255,255,255,0.18)_38px_40px)]" />
        <div className="absolute -bottom-56 -left-48 size-[40rem] rounded-full bg-[repeating-radial-gradient(circle,transparent_0_34px,rgba(40,52,68,0.06)_34px_36px)]" />
        <div className="absolute left-1/2 top-1/3 size-[36rem] -translate-x-1/2 rounded-full bg-white/25 blur-3xl" />
      </div>

      <div className={`${container} relative flex flex-col items-center py-28 text-center sm:py-36 lg:py-44`}>
        <h1
          className={`${display} max-w-5xl text-[3.4rem] leading-[0.85] font-black break-words sm:text-7xl lg:text-8xl xl:text-[8.5rem]`}
        >
          {hero.title}
        </h1>
        <a href="#contact" className={`${btnNavy} mt-10 max-w-full whitespace-normal`}>
          {hero.subtitle}
        </a>
      </div>
    </section>
  );
}
