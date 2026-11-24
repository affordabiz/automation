import { Check } from "lucide-react";
import type { TemplateProps } from "../types";
import { container, display, h2, section } from "./theme";

export function WhyUs({ copy }: TemplateProps) {
  return (
    <section id="why-us" className={`${section} bg-(--t2-sand)/60`}>
      <div className={`${container} grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16`}>
        <h2 className={`${h2} text-(--t2-navy) lg:sticky lg:top-28 lg:self-start`}>{copy.highlightsHeading}</h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {copy.highlights.map((h) => (
            <li
              key={h}
              className="flex items-center gap-4 rounded-2xl bg-white/80 p-5 ring-1 ring-inset ring-(--t2-navy)/5 transition duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_40px_-24px_rgba(40,52,68,0.5)] sm:p-6"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-(--t2-mint) text-(--t2-navy)">
                <Check className="size-5" strokeWidth={3} aria-hidden />
              </span>
              <span className={`${display} text-[1.35rem] leading-tight font-extrabold text-(--t2-navy)`}>{h}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
