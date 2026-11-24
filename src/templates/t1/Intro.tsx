import Image from "next/image";
import { BadgeCheck, CircleDollarSign, FileText, TriangleExclamationPoint } from "lucide-react";
import type { TemplateProps } from "../types";
import { container, h2, section } from "./theme";

const ICONS = [FileText, TriangleExclamationPoint, CircleDollarSign];

export function Intro({ site, copy }: TemplateProps) {
  return (
    <section id="about" className={`${section} bg-white`}>
      <div className={`${container} grid items-center gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20`}>
        <div className="relative mx-auto w-full max-w-[22rem] pb-6 pr-6 sm:max-w-md">
          <div aria-hidden className="absolute bottom-0 right-0 h-[88%] w-[85%] rounded-[2rem] bg-(--t1-orange)" />
          <div
            aria-hidden
            className="absolute -left-4 -top-4 size-24 rounded-2xl bg-[radial-gradient(var(--t1-teal)_1.5px,transparent_1.5px)] [background-size:12px_12px] opacity-40"
          />
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-(--t1-mint) shadow-[0_30px_60px_-25px_rgba(7,47,41,0.45)]">
            <Image
              unoptimized
              fill
              src={site.photoUrl}
              alt={site.fullName}
              className="object-cover object-top"
              sizes="(min-width: 1024px) 28rem, 90vw"
            />
          </div>
          <div className="absolute -bottom-1 left-4 flex max-w-[85%] items-center gap-3 rounded-2xl bg-white p-3.5 pr-5 shadow-xl ring-1 ring-black/5 sm:left-[-1.5rem]">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-(--t1-teal) text-white">
              <BadgeCheck className="size-5" aria-hidden />
            </span>
            <span className="min-w-0 text-sm leading-tight">
              <span className="block truncate font-bold text-(--t1-ink)">{site.fullName}</span>
              <span className="block text-slate-500">{copy.hero.badge}</span>
            </span>
          </div>
        </div>

        <div className="min-w-0">
          <h2 className={`${h2} max-w-2xl text-(--t1-ink)`}>{copy.intro.heading}</h2>
          <div className="mt-10 grid gap-4">
            {copy.intro.cards.map((card, i) => {
              const Icon = ICONS[i % ICONS.length];
              return (
                <article
                  key={i}
                  className="group flex flex-col gap-4 rounded-3xl bg-(--t1-mint) p-6 ring-1 ring-inset ring-(--t1-teal)/5 transition duration-300 hover:bg-white hover:shadow-[0_20px_40px_-20px_rgba(7,47,41,0.35)] hover:ring-(--t1-teal)/10 sm:flex-row sm:items-start sm:gap-5 sm:p-7"
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-(--t1-orange) text-white shadow-md transition group-hover:scale-105">
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <p className="leading-relaxed text-slate-700 sm:pt-1">{card.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
