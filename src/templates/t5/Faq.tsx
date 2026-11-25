import Image from "next/image";
import { Plus } from "lucide-react";
import { RichText } from "../RichText";
import type { TemplateProps } from "../types";
import { btnRed, container, h2, oswald, section } from "./theme";

export function Faq({ copy }: TemplateProps) {
  const items = copy.faq.items.filter((i) => i.answer.trim() !== "");
  if (items.length === 0) return null;
  return (
    <section id="faq" className={`${section} bg-white pt-4! sm:pt-6! lg:pt-8!`}>
      <div className={`${container} grid items-start gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12`}>
        <div className="min-w-0">
          <h2 className={`${h2} lg:text-[2.85rem]! lg:whitespace-nowrap`}>{copy.faq.heading}</h2>
          <div className="mt-6 overflow-hidden rounded-xl bg-(--t5-grey)">
            {items.map((item) => (
              <details key={item.question} className="group border-b border-white/60 last:border-b-0">
                <summary
                  className={`${oswald} flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 text-[1.05rem] leading-snug font-medium text-(--t5-ink) uppercase transition hover:bg-black/[0.03] sm:px-6 [&::-webkit-details-marker]:hidden`}
                >
                  {item.question}
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-(--t5-red) text-white transition duration-300 group-open:rotate-45">
                    <Plus className="size-4" strokeWidth={3} aria-hidden />
                  </span>
                </summary>
                <RichText
                  text={item.answer}
                  className="bg-(--t5-mist) px-5 py-6 text-[0.95rem] leading-relaxed text-[#333] sm:px-6 [&_a]:font-semibold [&_a]:text-(--t5-red) [&_li::marker]:text-(--t5-red)"
                />
              </details>
            ))}
          </div>
          {copy.faq.ctaLabel && (
            <a href="#contact" className={`${btnRed} mt-6`}>
              {copy.faq.ctaLabel}
            </a>
          )}
        </div>
        <div className="relative mx-auto w-full max-w-lg lg:mt-[4.6rem]">
          <div className="relative aspect-square overflow-hidden rounded-xl border-[5px] border-[#333]">
            <Image
              unoptimized
              fill
              src="/templates/t5/tax-time.jpg"
              alt="Tax time, need help?"
              className="object-cover"
              sizes="(min-width: 1024px) 32rem, 90vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
