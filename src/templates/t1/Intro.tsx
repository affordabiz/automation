import Image from "next/image";
import { CircleDollarSign, FileText, TriangleExclamationPoint } from "lucide-react";
import type { TemplateProps } from "../types";
import { container, display } from "./theme";

const ICONS = [FileText, TriangleExclamationPoint, CircleDollarSign];

export function Intro({ site, copy }: TemplateProps) {
  return (
    <section id="about" className="scroll-mt-20 bg-white py-20 lg:py-28">
      <div className={`${container} grid items-center gap-14 lg:grid-cols-[0.8fr_1.2fr]`}>
        <div className="relative mx-auto w-full max-w-sm">
          <div aria-hidden className="absolute -bottom-4 -right-4 size-full rounded-3xl bg-(--t1-orange)" />
          <div className="relative aspect-[5/6] overflow-hidden rounded-3xl bg-(--t1-mint) shadow-xl">
            <Image
              unoptimized
              fill
              src={site.photoUrl}
              alt={site.fullName}
              className="object-cover"
              sizes="(min-width: 1024px) 24rem, 90vw"
            />
          </div>
        </div>
        <div>
          <h2 className={`${display} text-3xl font-semibold text-(--t1-teal) sm:text-4xl`}>{copy.intro.heading}</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {copy.intro.cards.map((card, i) => {
              const Icon = ICONS[i % ICONS.length];
              return (
                <article key={i} className="rounded-2xl bg-(--t1-mint) p-6">
                  <span className="grid size-12 place-items-center rounded-xl bg-(--t1-orange)/15 text-(--t1-orange)">
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <p className="mt-4 text-sm leading-relaxed text-slate-700">{card.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
