import Image from "next/image";
import type { TemplateProps } from "../types";
import { btnGlass, container, h2, oswald, section } from "./theme";

const CARDS = [
  { bg: "bg-(--t5-blue)", icon: "/templates/t5/icon-prep.png" },
  { bg: "bg-(--t5-yellow) text-(--t5-slate)! [&_a]:bg-(--t5-slate)/10! [&_a]:text-(--t5-slate)! [&_a]:ring-(--t5-slate)/20! [&_a:hover]:bg-(--t5-slate)! [&_a:hover]:text-white!", icon: "/templates/t5/icon-amended.png" },
  { bg: "bg-(--t5-mauve)", icon: "/templates/t5/icon-delinquent.png" },
];

export function Services({ copy }: TemplateProps) {
  const { services } = copy;
  return (
    <section id="services" className={`${section} bg-white`}>
      <div className={container}>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className={h2}>{services.heading}</h2>
          <p className="mt-4 leading-[2] text-[#555]">{copy.highlights.join(" | ")}</p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3 lg:mt-12 lg:gap-8">
          {services.items.map((item, i) => {
            const { bg, icon } = CARDS[i % CARDS.length];
            return (
              <article key={item.title} className={`flex flex-col items-center rounded-xl px-6 py-10 text-center text-white sm:px-8 ${bg}`}>
                <Image unoptimized src={icon} alt="" width={120} height={120} className="size-24" />
                <h3 className={`${oswald} mt-6 text-xl font-semibold tracking-[0.5px] uppercase`}>{item.title}</h3>
                <p className="mt-4 flex-1 leading-[2] font-medium">{item.body}</p>
                {services.ctaLabel && (
                  <a href="#contact" className={`${btnGlass} mt-7`}>
                    {services.ctaLabel}
                  </a>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
