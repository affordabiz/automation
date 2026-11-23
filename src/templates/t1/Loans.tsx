import Image from "next/image";
import { CircleDollarSign, Percent } from "lucide-react";
import type { TemplateProps } from "../types";
import { container, display } from "./theme";

const ICONS = [CircleDollarSign, Percent];

export function Loans({ copy }: TemplateProps) {
  const { loans } = copy;
  return (
    <section id="cash-advance" className="relative scroll-mt-20 bg-(--t1-teal) py-20 text-white lg:py-28">
      <div className={`${container} grid gap-10 lg:grid-cols-[0.75fr_1.25fr]`}>
        <div className="flex flex-col items-center justify-center rounded-3xl bg-(--t1-orange) p-10 text-center shadow-xl">
          {loans.promoLines.map((line) => (
            <p key={line} className={`${display} text-4xl font-bold uppercase leading-tight`}>
              {line}
            </p>
          ))}
          <p className="mt-8 grid size-44 place-items-center rounded-full bg-(--t1-teal) p-6 text-lg font-bold uppercase leading-snug">
            {loans.promoBadge}
          </p>
        </div>
        <div>
          <div className="mx-auto w-fit rounded-2xl bg-white px-6 py-4">
            {loans.partnerLogoUrl ? (
              <Image
                unoptimized
                src={loans.partnerLogoUrl}
                alt={loans.partnerName}
                width={320}
                height={90}
                className="h-16 w-auto object-contain"
              />
            ) : (
              <p className={`${display} text-3xl font-bold italic text-(--t1-crimson)`}>{loans.partnerName}</p>
            )}
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {loans.cards.map((c, i) => {
              const Icon = ICONS[i % ICONS.length];
              return (
                <article key={c.title} className="rounded-3xl bg-(--t1-crimson) p-8 text-center shadow-lg">
                  <Icon className="mx-auto size-10 text-white/90" aria-hidden />
                  <h3 className="mt-4 text-lg font-bold uppercase tracking-wide">{c.title}</h3>
                  <p className="mt-2 text-sm font-semibold uppercase text-white/85">{c.detail}</p>
                </article>
              );
            })}
          </div>
          {loans.disclaimers.length > 0 && (
            <ol className="mt-6 list-decimal space-y-2 pl-5 text-[11px] leading-relaxed text-white/70">
              {loans.disclaimers.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}
