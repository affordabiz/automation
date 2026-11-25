import Image from "next/image";
import { Check } from "lucide-react";
import type { TemplateProps } from "../types";
import { container, display } from "./theme";

const TILES = [
  { tile: "bg-(--t2-navy) text-(--t2-tan) leading-[1.8]", icon: "/templates/t2/icon-refund.png" },
  { tile: "bg-(--t2-tan) text-(--t2-navy) leading-[1.8]", icon: "/templates/t2/icon-target.png" },
  { tile: "bg-[#fafafa] text-(--t2-navy) leading-[1.55] pt-16! lg:pt-[4.75rem]! lg:pb-[3.1rem]!", icon: null },
];

/** Line shapes behind the tiles and "Why Us?", drawn from the reference background art. */
function Shapes() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block">
      <div className="absolute top-[18rem] -left-24 h-52 w-[12.5rem] rounded-r-full border-2 border-(--t2-tan)" />
      <svg className="absolute bottom-0 left-0 h-[22rem] w-36 text-(--t2-navy)" viewBox="0 0 144 352" preserveAspectRatio="none">
        <path d="M0 84 L144 0 V262 L0 352 Z" fill="currentColor" />
      </svg>
      <svg className="absolute right-0 bottom-0 h-20 w-32 text-(--t2-tan)" viewBox="0 0 128 80" preserveAspectRatio="none">
        <path d="M128 0 V80 H0 Z" fill="currentColor" />
      </svg>
    </div>
  );
}

export function Features({ copy }: TemplateProps) {
  return (
    <section className="relative bg-white pt-12 lg:pt-14">
      <Shapes />
      <div className={`${container} relative`}>
        <div className="grid gap-6 md:grid-cols-3 md:gap-8">
          {copy.intro.cards.map((card, i) => {
            const { tile, icon } = TILES[i % TILES.length];
            return (
              <article key={i} className={`relative rounded-2xl px-6 py-8 sm:px-8 lg:pt-8 lg:pb-12 ${tile}`}>
                {icon ? (
                  <span className="mb-6 inline-block border-[5px] border-[#333]/80 p-0.5">
                    <Image unoptimized src={icon} alt="" width={64} height={64} className="size-16" />
                  </span>
                ) : (
                  <span className="absolute -top-7 right-6 border-[5px] border-[#333]/80 bg-white p-0.5 lg:-top-10">
                    <Image unoptimized src="/templates/t2/leaf.png" alt="" width={82} height={82} className="size-[4.5rem] lg:size-[5.1rem]" />
                  </span>
                )}
                <h3 className={`${display} text-[1.6rem] font-black sm:text-[1.85rem]`}>{card.body}</h3>
              </article>
            );
          })}
        </div>

        <div id="why-us" className="scroll-mt-24 pt-14 lg:pt-16">
          <h2 className={`${display} text-[2.6rem] leading-tight font-black text-(--t2-navy) lg:text-5xl`}>{copy.highlightsHeading}</h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-x-8 md:gap-y-5">
            {copy.highlights.map((h) => (
              <li key={h} className="flex items-center gap-4 rounded-xl bg-[#fafafa] px-4 py-4 ring-1 ring-inset ring-(--t2-navy)/5">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-(--t2-mint) text-(--t2-navy)">
                  <Check className="size-5" strokeWidth={3} aria-hidden />
                </span>
                <span className={`${display} text-[1.15rem] leading-snug font-extrabold text-(--t2-navy)`}>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
