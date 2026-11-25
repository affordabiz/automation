import Image from "next/image";
import type { TemplateProps } from "../types";
import { container, display } from "./theme";

/** The grey panel that overlaps the hero: heading, portrait and the three services. */
export function About({ site, copy }: TemplateProps) {
  return (
    <section className="relative bg-white">
      {/* Mint block beside the panel, as on the reference. */}
      <div aria-hidden className="absolute top-0 right-0 bottom-16 hidden w-[10.5%] bg-(--t4-mint) lg:block" />
      <div className={`${container} relative z-10 -mt-[6.5rem]`}>
        <div
          id="services"
          className="relative scroll-mt-24 rounded-2xl bg-(--t4-grey) px-5 pt-10 pb-12 text-white sm:px-10 lg:px-14 lg:pt-24 lg:pb-14"
        >
          <div className="mx-auto mb-8 w-44 sm:w-52 lg:absolute lg:-top-[4.5rem] lg:right-14 lg:mb-0 lg:w-56">
            <div className="relative aspect-square overflow-hidden rounded-xl border-[5px] border-(--t4-sand) bg-(--t4-sand) shadow-[0_2px_18px_rgba(0,0,0,0.3)]">
              <Image unoptimized fill src={site.photoUrl} alt="Tax Preparer Portrait" className="object-cover object-top" sizes="14rem" />
            </div>
          </div>
          <h2
            className={`${display} text-center text-[2rem] leading-[1.1] font-bold sm:text-[2.6rem] lg:pr-64 lg:text-left lg:text-[2.75rem]`}
          >
            {copy.intro.heading
              .replace(/(Cash Advance)\s+/, "$1\n")
              .split("\n")
              .map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
          </h2>

          <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8 lg:mt-16">
            {copy.services.items.map((item) => (
              <article key={item.title}>
                <h3 className={`${display} border-b-2 border-white pb-5 text-[1.3rem] font-medium`}>{item.title}</h3>
                {/* Paragraph breaks in the body are kept, matching the reference. */}
                <p className="mt-6 leading-[1.55] font-light whitespace-pre-line text-[#222]">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
