import Image from "next/image";
import { ArrowRight, BookOpen, CircleDollarSign, TriangleAlert } from "lucide-react";
import type { TemplateProps } from "../types";
import { btnAccent, btnArrow, container, head, section, type Variant } from "./variant";

type Props = TemplateProps & { v: Variant };

const HIGHLIGHT_ICONS = [
  "/templates/t6/store.png",
  "/templates/t6/quality-service.png",
  "/templates/t6/customer-service-agent.png",
  "/templates/t6/expertise.png",
  "/templates/t6/peace.png",
  "/templates/t6/skill.png",
];
const INTRO_IMAGES = ["/templates/t6/document.png", "/templates/t6/danger.png", "/templates/t6/coin.png"];
const INTRO_LINE_ICONS = [BookOpen, TriangleAlert, CircleDollarSign];

export function Highlights({ copy, v }: Props) {
  const overlap = v.highlights === "overlap";
  return (
    <section className={overlap ? "relative z-10 -mt-20 pb-4" : "bg-(--x-band) py-8 sm:py-10"}>
      <div className={container}>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {copy.highlights.map((h, i) => (
            <li
              key={h}
              className="flex flex-col items-start gap-3 rounded-xl bg-white p-4 text-sm leading-snug font-medium text-[#222] shadow-[0_14px_30px_-20px_rgba(0,0,0,0.6)] ring-1 ring-black/5"
            >
              <span className="grid size-11 place-items-center rounded-lg bg-(--x-light)">
                <Image unoptimized src={HIGHLIGHT_ICONS[i % HIGHLIGHT_ICONS.length]} alt="" width={28} height={28} className="size-6" />
              </span>
              {h}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Intro({ copy, v }: Props) {
  const dark = v.dark.intro;
  const { intro } = copy;
  return (
    <section id="about" className={`${section} ${dark ? "bg-(--x-dark) text-white" : "bg-white"}`}>
      <div className={container}>
        <div className="mx-auto max-w-2xl text-center">
          <h2
            className={`${head} text-[2.1rem] leading-tight font-bold capitalize sm:text-[2.6rem] ${dark ? "text-(--x-accent)" : "text-(--x-head-light)"}`}
          >
            {intro.heading}
          </h2>
          <span aria-hidden className={`mx-auto mt-5 block h-1 w-24 rounded-full ${dark ? "bg-white" : "bg-(--x-accent)"}`} />
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {intro.cards.map((card, i) => {
            const Line = INTRO_LINE_ICONS[i % INTRO_LINE_ICONS.length];
            return (
              <article key={i} className="flex flex-col rounded-2xl bg-white p-7 text-[#444] shadow-[0_20px_44px_-28px_rgba(0,0,0,0.7)] ring-1 ring-black/5">
                <span className="grid size-14 place-items-center rounded-xl bg-(--x-light) text-(--x-accent)">
                  {v.introIcons === "image" ? (
                    <Image unoptimized src={INTRO_IMAGES[i % INTRO_IMAGES.length]} alt="" width={40} height={40} className="size-8" />
                  ) : (
                    <Line className="size-7" aria-hidden />
                  )}
                </span>
                <p className="mt-5 leading-relaxed">{card.body}</p>
              </article>
            );
          })}
        </div>
        {intro.ctaLabel && (
          <div className="mt-12 flex justify-center">
            <a href="#contact" className={btnAccent}>
              {intro.ctaLabel}
              <ArrowRight className={btnArrow} aria-hidden />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

export function Services({ copy, v }: Props) {
  const dark = v.dark.services;
  const { services } = copy;
  return (
    <section id="services" className={`${section} ${dark ? "bg-(--x-dark) text-white" : "bg-(--x-light)"}`}>
      <div className={container}>
        <div className="grid items-end gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
          <h2
            className={`${head} text-[2.6rem] leading-none font-bold sm:text-6xl ${
              dark ? "text-white" : "inline-block rounded-2xl bg-(--x-dark) px-7 py-6 text-(--x-accent) lg:justify-self-start"
            }`}
          >
            {services.heading}
          </h2>
          <p className={`leading-relaxed ${dark ? "text-white/85" : "text-[#333]"}`}>{copy.highlights.join(" | ")}</p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3 lg:mt-12">
          {services.items.map((item, i) => (
            <article key={item.title} className="flex flex-col rounded-2xl bg-white p-7 text-[#444] shadow-[0_20px_44px_-28px_rgba(0,0,0,0.6)] ring-1 ring-black/5">
              <Image unoptimized src={v.serviceIcons[i % v.serviceIcons.length]} alt="" width={56} height={56} className="size-12" />
              <h3 className={`${head} mt-5 text-xl font-semibold text-[#111]`}>{item.title}</h3>
              <p className="mt-3 text-[0.95rem] leading-relaxed">{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
