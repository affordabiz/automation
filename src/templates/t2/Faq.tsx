import { ArrowRight, Plus } from "lucide-react";
import { RichText } from "../RichText";
import type { TemplateProps } from "../types";
import { btnArrow, btnNavy, container, display, h2, section } from "./theme";

export function Faq({ copy }: TemplateProps) {
  const items = copy.faq.items.filter((i) => i.answer.trim() !== "");
  if (items.length === 0) return null;
  return (
    <section id="faq" className={`${section} relative overflow-hidden bg-(--t2-navy)`}>
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -right-48 -top-48 size-[42rem] rounded-full bg-[repeating-radial-gradient(circle,transparent_0_40px,rgba(221,204,184,0.07)_40px_42px)]" />
        <div className="absolute -bottom-40 -left-40 size-[34rem] rounded-full bg-(--t2-sage)/20 blur-3xl" />
      </div>
      <div className={`${container} relative`}>
        <div className="mx-auto max-w-4xl rounded-[2rem] bg-(--t2-mint)/95 p-5 shadow-2xl sm:p-10 lg:p-14">
          <h2 className={`${h2} text-center text-(--t2-navy)`}>{copy.faq.heading}</h2>
          <div className="mt-10 overflow-hidden rounded-[1.5rem] bg-white shadow-sm">
            {items.map((item) => (
              <details key={item.question} className="group border-b border-(--t2-navy)/10 last:border-b-0">
                <summary
                  className={`${display} flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 text-[1.35rem] leading-tight font-extrabold text-(--t2-navy) transition hover:bg-(--t2-cream) sm:px-8 sm:text-2xl [&::-webkit-details-marker]:hidden`}
                >
                  {item.question}
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-(--t2-navy) text-(--t2-tan) transition duration-300 group-open:rotate-45">
                    <Plus className="size-5" aria-hidden />
                  </span>
                </summary>
                <RichText
                  text={item.answer}
                  className="px-5 pb-7 leading-relaxed text-slate-600 sm:px-8 [&_a]:font-semibold [&_a]:text-(--t2-navy) [&_a:hover]:text-(--t2-sage) [&_li::marker]:text-(--t2-sage) [&_strong]:text-(--t2-navy)"
                />
              </details>
            ))}
          </div>
          {copy.cta.buttonLabel && (
            <div className="mt-10 flex justify-center">
              <a href="#contact" className={`${btnNavy} font-bold tracking-[0.08em]`}>
                {copy.cta.buttonLabel}
                <ArrowRight className={btnArrow} aria-hidden />
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
