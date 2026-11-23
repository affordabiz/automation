import type { TemplateProps } from "../types";
import { btnPrimary, container, display } from "./theme";

export function Cta({ copy }: TemplateProps) {
  return (
    <section className="bg-white py-20">
      <div className={`${container} flex flex-col items-center text-center`}>
        <h2 className={`${display} text-4xl font-semibold text-(--t1-teal-deep) sm:text-5xl`}>{copy.cta.heading}</h2>
        <a href="#contact" className={`${btnPrimary} mt-8`}>
          {copy.cta.buttonLabel}
        </a>
      </div>
    </section>
  );
}
