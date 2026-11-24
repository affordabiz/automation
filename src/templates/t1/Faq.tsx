import { Plus } from "lucide-react";
import { RichText } from "../RichText";
import type { TemplateProps } from "../types";
import { container, display, h2, section } from "./theme";

export function Faq({ copy }: TemplateProps) {
  const items = copy.faq.items.filter((i) => i.answer.trim() !== "");
  if (items.length === 0) return null;
  return (
    <section id="faq" className={`${section} bg-white`}>
      <div className={`${container} grid gap-10 lg:grid-cols-[0.55fr_1.45fr] lg:gap-16`}>
        <h2 className={`${h2} text-(--t1-teal) lg:sticky lg:top-28 lg:self-start`}>{copy.faq.heading}</h2>
        <div className="space-y-3">
          {items.map((item) => (
            <details
              key={item.question}
              className="group rounded-2xl bg-(--t1-mint)/60 ring-1 ring-inset ring-(--t1-teal)/10 transition open:bg-white open:shadow-[0_16px_40px_-24px_rgba(7,47,41,0.4)]"
            >
              <summary
                className={`${display} flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-5 text-lg font-semibold text-(--t1-ink) sm:px-7 sm:text-xl [&::-webkit-details-marker]:hidden`}
              >
                {item.question}
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-(--t1-orange) text-white transition duration-300 group-open:rotate-45 group-open:bg-(--t1-teal)">
                  <Plus className="size-5" aria-hidden />
                </span>
              </summary>
              <RichText
                text={item.answer}
                className="px-5 pb-6 leading-relaxed text-slate-600 sm:px-7 [&_a]:text-(--t1-teal) [&_a:hover]:text-(--t1-orange-deep)"
              />
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
