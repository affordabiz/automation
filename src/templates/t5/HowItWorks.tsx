import { CircleDollarSign, FileText, TriangleAlert } from "lucide-react";
import type { TemplateProps } from "../types";
import { btnRed, container, h2, oswald, section } from "./theme";

const ICONS = [FileText, TriangleAlert, CircleDollarSign];

export function HowItWorks({ copy }: TemplateProps) {
  const { intro } = copy;
  return (
    <section id="about" className={`${section} bg-white pt-4! sm:pt-6! lg:pt-8!`}>
      <div className={container}>
        <div className="text-center">
          <h2 className={h2}>{intro.heading}</h2>
          {intro.subheading && <p className="mt-3 text-[1.05rem] text-[#555]">{intro.subheading}</p>}
        </div>

        <div className="relative mt-10">
          {/* Dotted line linking the three steps on wide screens. */}
          <div aria-hidden className="absolute inset-x-0 top-10 hidden border-t-2 border-dotted border-black/20 md:block" />
          <ol className="relative grid gap-12 md:grid-cols-3 md:gap-8">
            {intro.cards.map((card, i) => {
              const Icon = ICONS[i % ICONS.length];
              return (
                <li key={i} className="flex flex-col items-center text-center">
                  <span className="grid size-20 place-items-center rounded-full bg-[#f6f6f6] text-(--t5-red) ring-8 ring-white">
                    <Icon className="size-8" strokeWidth={1.6} aria-hidden />
                  </span>
                  {card.title && (
                    <h3 className={`${oswald} mt-6 text-xl font-medium tracking-[0.5px] text-(--t5-mauve) uppercase`}>{card.title}</h3>
                  )}
                  <p className="mt-3 max-w-sm leading-[2] text-[#555]">{card.body}</p>
                </li>
              );
            })}
          </ol>
        </div>

        {intro.ctaLabel && (
          <div className="mt-12 flex justify-center">
            <a href="#contact" className={btnRed}>
              {intro.ctaLabel}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
