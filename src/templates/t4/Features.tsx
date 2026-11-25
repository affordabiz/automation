import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { TemplateProps } from "../types";
import { container, display } from "./theme";

const TILES = [
  { tile: "bg-(--t4-grey)", icon: "/templates/t4/icon-refund.png" },
  { tile: "bg-(--t4-tan)", icon: "/templates/t4/icon-target.png" },
  { tile: "bg-(--t4-olive)", icon: "/templates/t4/leaf.png" },
];

/** Line shapes behind the tiles and "Why Us?", drawn from the reference background art. */
function Shapes() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block">
      <div className="absolute top-[18rem] -left-24 h-52 w-[12.5rem] rounded-r-full border-2 border-(--t4-tan)" />
      <svg className="absolute bottom-0 left-0 h-[22rem] w-36 text-(--t4-navy)" viewBox="0 0 144 352" preserveAspectRatio="none">
        <path d="M0 84 L144 0 V262 L0 352 Z" fill="currentColor" />
      </svg>
      <svg className="absolute right-0 bottom-0 h-20 w-32 text-(--t4-tan)" viewBox="0 0 128 80" preserveAspectRatio="none">
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
              <article key={i} className={`relative rounded-2xl px-6 py-8 text-white sm:px-8 lg:pt-8 lg:pb-12 ${tile}`}>
                <span className="mb-6 inline-block border-[5px] border-[#333]/80 p-0.5">
                  <Image unoptimized src={icon} alt="" width={64} height={64} className="size-14" />
                </span>
                <h3 className={`${display} text-[1.45rem] leading-[1.55] font-medium sm:text-[1.6rem]`}>{card.body}</h3>
              </article>
            );
          })}
        </div>

        <div id="why-us" className="scroll-mt-24 pt-14 lg:pt-16">
          <h2 className={`${display} text-[2.6rem] leading-tight font-medium text-(--t4-slate) lg:text-5xl`}>{copy.highlightsHeading}</h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-x-8 md:gap-y-5">
            {copy.highlights.map((h) => (
              <li key={h} className="flex items-center gap-4 rounded-xl bg-[#fafafa] px-4 py-4 ring-1 ring-inset ring-(--t4-slate)/10">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-(--t4-slate) text-white">
                  <ArrowRight className="size-5" strokeWidth={2.5} aria-hidden />
                </span>
                <span className={`${display} text-[1.05rem] leading-snug font-normal text-[#222]`}>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
