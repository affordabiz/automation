import { ChevronDown } from "lucide-react";
import { RichText } from "../RichText";
import type { TemplateProps } from "../types";
import { container, display } from "./theme";

export function Faq({ copy }: TemplateProps) {
  const items = copy.faq.items.filter((i) => i.answer.trim() !== "");
  if (items.length === 0) return null;
  return (
    <section id="faq" className="scroll-mt-20 bg-white py-20 lg:py-28">
      <div className={`${container} grid gap-10 lg:grid-cols-[0.6fr_1.4fr]`}>
        <h2 className={`${display} text-4xl font-semibold text-(--t1-teal) sm:text-5xl`}>{copy.faq.heading}</h2>
        <div className="divide-y divide-slate-200 border-y border-slate-200">
          {items.map((item) => (
            <details key={item.question} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-(--t1-teal-deep)">
                {item.question}
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-(--t1-orange) text-white transition group-open:rotate-180">
                  <ChevronDown className="size-4" aria-hidden />
                </span>
              </summary>
              <RichText text={item.answer} className="mt-4 text-sm leading-relaxed text-slate-600" />
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
