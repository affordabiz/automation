import Image from "next/image";
import type { TemplateProps } from "../types";
import { container, display, h2 } from "./theme";

const EYEBROW = /^(\$[\d,]+\s*-\s*\$[\d,]+\s+Cash Advance)\s*(.*)$/i;

export function About({ site, copy }: TemplateProps) {
  // The reference sets the dollar range in a lighter tone above the main line.
  const match = copy.intro.heading.match(EYEBROW);
  return (
    <section className="bg-(--t2-cream)">
      <div id="about" className={`${container} scroll-mt-20 pt-20 sm:pt-24 lg:pt-28`}>
        <div className="grid items-center gap-12 lg:grid-cols-[1.25fr_0.75fr] lg:gap-16">
          <h2 className={`${h2} text-(--t2-navy)`}>
            {match ? (
              <>
                <span className="block text-(--t2-sage)">{match[1]}</span>
                {match[2]}
              </>
            ) : (
              copy.intro.heading
            )}
          </h2>
          <div className="relative mx-auto w-full max-w-xs sm:max-w-sm">
            <div aria-hidden className="absolute -inset-3 rotate-3 rounded-[2.25rem] bg-(--t2-mint)" />
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border-[6px] border-(--t2-sand) bg-(--t2-mint) shadow-[0_24px_60px_-20px_rgba(0,0,0,0.35)]">
              <Image
                unoptimized
                fill
                src={site.photoUrl}
                alt={`${site.fullName}, tax preparer`}
                className="object-cover object-top"
                sizes="(min-width: 1024px) 24rem, 80vw"
              />
            </div>
          </div>
        </div>
      </div>

      <div id="services" className={`${container} scroll-mt-20 py-16 sm:py-20`}>
        <div className="grid gap-x-10 gap-y-12 md:grid-cols-3">
          {copy.services.items.map((item) => (
            <article key={item.title} className="rounded-3xl bg-white/70 p-7 ring-1 ring-inset ring-(--t2-navy)/5 sm:p-8">
              <span aria-hidden className="block h-1.5 w-12 rounded-full bg-(--t2-tan)" />
              <h3
                className={`${display} mt-5 border-b-2 border-(--t2-navy) pb-3 text-[1.9rem] leading-none font-black text-(--t2-navy)`}
              >
                {item.title}
              </h3>
              <p className="mt-5 leading-relaxed text-slate-600">{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
