import { Plus } from "lucide-react";
import { RichText } from "../RichText";
import type { TemplateProps } from "../types";
import { btnNavy, container, display, h2 } from "./theme";

/** Laptop photo behind the FAQ panel; the navy fallback keeps the panel readable if it's missing. */
const FAQ_BG = "bg-(--t2-navy) bg-[url('/templates/t2/faq.jpg')] bg-cover bg-center lg:bg-fixed";

export function Faq({ copy }: TemplateProps) {
  const items = copy.faq.items.filter((i) => i.answer.trim() !== "");
  if (items.length === 0) return null;
  return (
    <section id="faq" className={`scroll-mt-20 py-14 lg:py-14 ${FAQ_BG}`}>
      <div className={container}>
        <div className="rounded-[30px] bg-[rgba(197,213,203,0.9)] px-5 py-10 sm:px-10 lg:px-[5.5%] lg:py-20">
          <h2 className={h2}>{copy.faq.heading}</h2>
          <div className="mt-10 overflow-hidden rounded-[30px] bg-(--t2-sand)">
            {items.map((item) => (
              <details key={item.question} className="group border-b border-black/5 last:border-b-0">
                <summary
                  className={`${display} flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-6 text-[1.1rem] leading-snug font-extrabold text-(--t2-navy) sm:text-lg [&::-webkit-details-marker]:hidden`}
                >
                  {item.question}
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-(--t2-mint) text-white transition duration-300 group-open:rotate-45">
                    <Plus className="size-4" strokeWidth={3} aria-hidden />
                  </span>
                </summary>
                <RichText
                  text={item.answer}
                  className="px-5 pb-7 text-[1.05rem] leading-relaxed text-[#555] sm:px-8 [&_a]:font-bold [&_a]:text-(--t2-navy) [&_strong]:text-(--t2-navy)"
                />
              </details>
            ))}
          </div>
        </div>
        {copy.cta.buttonLabel && (
          <div className="mt-7 flex justify-center">
            <a href="#contact" className={btnNavy}>
              {copy.cta.buttonLabel}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
