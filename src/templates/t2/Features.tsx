import { CircleDollarSign, Target, Zap } from "lucide-react";
import type { TemplateProps } from "../types";
import { container, display } from "./theme";

/** Three statement tiles: navy, tan and light, as on the reference. */
const TILES = [
  { icon: CircleDollarSign, tile: "bg-(--t2-navy) text-(--t2-tan)", badge: "bg-(--t2-tan) text-(--t2-navy)" },
  { icon: Target, tile: "bg-(--t2-tan) text-(--t2-navy)", badge: "bg-(--t2-navy) text-(--t2-tan)" },
  { icon: Zap, tile: "bg-white text-(--t2-navy) ring-1 ring-inset ring-(--t2-navy)/10", badge: "bg-(--t2-navy) text-white" },
];

export function Features({ copy }: TemplateProps) {
  return (
    <section className="relative bg-(--t2-cream) pb-20 sm:pb-24 lg:pb-28">
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-(--t2-sand)/60" />
      <div className={`${container} relative`}>
        <div className="grid overflow-hidden rounded-[2rem] shadow-[0_30px_70px_-35px_rgba(40,52,68,0.6)] md:grid-cols-3">
          {copy.intro.cards.map((card, i) => {
            const { icon: Icon, tile, badge } = TILES[i % TILES.length];
            return (
              <article key={i} className={`flex flex-col gap-6 p-8 sm:p-10 ${tile}`}>
                <span className={`grid size-16 place-items-center rounded-tl-[1.75rem] rounded-br-[1.75rem] rounded-tr-md rounded-bl-md ${badge}`}>
                  <Icon className="size-8" strokeWidth={1.6} aria-hidden />
                </span>
                <h3 className={`${display} text-[1.85rem] leading-[1.05] font-black sm:text-[2.1rem]`}>{card.body}</h3>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
