import { Plus } from "lucide-react";
import { RichText } from "../RichText";
import type { TemplateProps } from "../types";
import { container, head, section, type Variant } from "./variant";

/** Shows the last word of the heading in the accent colour (Template 7's "QUESTIONS"). */
function Heading({ text, dark, splitLast }: { text: string; dark: boolean; splitLast: boolean }) {
  const words = text.trim().split(/\s+/);
  const last = splitLast && words.length > 1 ? words.pop() : null;
  return (
    <h2
      className={`${head} text-center text-[2.1rem] leading-tight font-bold sm:text-[2.6rem] ${
        splitLast ? "tracking-wide uppercase" : ""
      } ${dark ? "text-(--x-accent)" : "text-[#1b1b1b]"}`}
    >
      {words.join(" ")}
      {last && <span className="text-(--x-accent)"> {last}</span>}
    </h2>
  );
}

export function Faq({ copy, v }: TemplateProps & { v: Variant }) {
  const dark = v.dark.faq;
  const items = copy.faq.items.filter((i) => i.answer.trim() !== "");
  if (items.length === 0) return null;
  const twoCol = v.faqColumns === 2;
  const columns = twoCol ? [items.slice(0, Math.ceil(items.length / 2)), items.slice(Math.ceil(items.length / 2))] : [items];

  return (
    <section id="faq" className={`${section} ${dark ? "bg-(--x-dark)" : "bg-white"}`}>
      <div className={`${container} ${twoCol ? "" : "max-w-4xl!"}`}>
        <Heading text={copy.faq.heading} dark={dark} splitLast={twoCol} />
        <div className={`mt-10 grid items-start gap-3 ${twoCol ? "lg:grid-cols-2 lg:gap-5" : ""}`}>
          {columns.map((col, c) => (
            <div key={c} className="space-y-3">
              {col.map((item) => (
                <details
                  key={item.question}
                  className={`group overflow-hidden rounded-xl transition ${
                    dark ? "bg-white/[0.04] ring-1 ring-white/15 open:bg-white/[0.07]" : "bg-[#f1f3f5] ring-1 ring-black/5 open:bg-white open:shadow-[0_16px_36px_-24px_rgba(0,0,0,0.5)]"
                  }`}
                >
                  <summary
                    className={`flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-medium sm:px-6 [&::-webkit-details-marker]:hidden ${
                      dark ? "text-white" : "text-[#1b1b1b]"
                    } ${twoCol ? `${head} text-[0.95rem] tracking-wide uppercase` : "text-base"}`}
                  >
                    {item.question}
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-(--x-accent) text-(--x-on-accent) transition duration-300 group-open:rotate-45">
                      <Plus className="size-4" strokeWidth={3} aria-hidden />
                    </span>
                  </summary>
                  <RichText
                    text={item.answer}
                    className="mx-3 mb-4 rounded-lg bg-white px-5 py-5 text-[0.95rem] leading-relaxed text-[#333] sm:mx-4 [&_a]:font-semibold [&_a]:text-(--x-accent-deep) [&_a]:underline"
                  />
                </details>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
