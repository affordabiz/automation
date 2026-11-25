import { ArrowRight, Plus } from "lucide-react";
import { RichText } from "../RichText";
import type { TemplateProps } from "../types";
import { btnSlate, container, display, h2 } from "./theme";

/** Laptop photo behind the FAQ panel; the slate fallback keeps the panel readable if it's missing. */
const FAQ_BG = "bg-(--t4-slate) bg-[url('/templates/t4/faq.jpg')] bg-cover bg-center lg:bg-fixed";

export function Faq({ copy }: TemplateProps) {
  const items = copy.faq.items.filter((i) => i.answer.trim() !== "");
  if (items.length === 0) return null;
  return (
    <section id="faq" className={`scroll-mt-20 py-14 sm:py-16 lg:py-20 ${FAQ_BG}`}>
      <div className={container}>
        <div className="rounded-2xl bg-(--t4-grey)/95 px-4 py-10 sm:px-10 lg:px-14 lg:py-16">
          <h2 className={`${h2} text-[#eee]`}>{copy.faq.heading}</h2>
          <div className="mt-8 lg:mt-10">
            {items.map((item) => (
              <details key={item.question} className="group border-b border-white/15 last:border-b-0">
                <summary
                  className={`${display} flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg px-3 py-5 text-[1.05rem] leading-snug font-medium text-(--t4-navy) transition hover:bg-white/10 sm:px-5 sm:text-lg [&::-webkit-details-marker]:hidden`}
                >
                  {item.question}
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-(--t4-mint) text-(--t4-grey) transition duration-300 group-open:rotate-45">
                    <Plus className="size-4" strokeWidth={3} aria-hidden />
                  </span>
                </summary>
                <RichText
                  text={item.answer}
                  className="mx-1 mb-5 rounded-xl bg-white/90 px-5 py-5 text-[1.02rem] leading-relaxed font-normal text-[#333] sm:mx-3 sm:px-7 [&_a]:font-semibold [&_a]:text-(--t4-crimson) [&_strong]:text-(--t4-navy)"
                />
              </details>
            ))}
          </div>
        </div>
        {copy.cta.buttonLabel && (
          <div className="mt-8 flex justify-center">
            <a href="#contact" className={`${btnSlate} pr-3! sm:pr-3!`}>
              {copy.cta.buttonLabel}
              <span className="grid size-7 shrink-0 place-items-center rounded-md bg-white/15 transition group-hover:translate-x-0.5">
                <ArrowRight className="size-4" aria-hidden />
              </span>
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
