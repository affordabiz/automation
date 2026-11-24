import Image from "next/image";
import type { TemplateProps } from "../types";
import { container, display } from "./theme";

/** The mint panel that overlaps the hero: heading, portrait and the three services. */
export function About({ site, copy }: TemplateProps) {
  return (
    <section className="relative bg-white">
      {/* The hero photo continues behind the top of the panel, as on the reference. */}
      <div className={`${container} relative z-10 -mt-[6.5rem]`}>
        <div id="services" className="relative scroll-mt-24 bg-(--t2-mint) px-6 pt-10 pb-12 sm:px-10 lg:pt-24 lg:pb-14">
          <div className="mx-auto mb-8 w-44 sm:w-52 lg:absolute lg:-top-[4.5rem] lg:right-0 lg:mb-0 lg:w-56">
            <div className="relative aspect-square border-[5px] border-(--t2-sand) bg-(--t2-sand) shadow-[0_2px_18px_rgba(0,0,0,0.3)]">
              <Image
                unoptimized
                fill
                src={site.photoUrl}
                alt="Tax Preparer Portrait"
                className="object-cover object-top"
                sizes="14rem"
              />
            </div>
          </div>
          <h2
            className={`${display} text-[2.1rem] leading-[1.15] font-black text-(--t2-navy) sm:text-[2.6rem] lg:pr-60 lg:text-[2.75rem]`}
          >
            {copy.intro.heading.replace(/(Cash Advance)\s+/, "$1\n")
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
                <h3 className={`${display} border-b-2 border-(--t2-navy) pb-6 text-[1.4rem] font-black text-(--t2-navy)`}>
                  {item.title}
                </h3>
                <p className="mt-6 text-[1.05rem] leading-[1.55] text-[#666]">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
