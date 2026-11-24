import Image from "next/image";
import { cleanDisclaimers, RefundOffers } from "../shared/RefundOffers";
import type { TemplateProps } from "../types";
import { container, display, section } from "./theme";

export function Loans({ copy }: TemplateProps) {
  const { loans } = copy;
  const disclaimers = cleanDisclaimers(loans.disclaimers);
  return (
    <section id="cash-advance" className={`${section} relative overflow-hidden bg-(--t1-teal) text-white`}>
      <div aria-hidden className="pointer-events-none absolute -left-40 top-1/3 size-[30rem] rounded-full bg-(--t1-orange)/10 blur-3xl" />
      <div className={`${container} relative`}>
        <div className="grid items-stretch gap-6 lg:grid-cols-[0.7fr_1.3fr] lg:gap-8">
          {/* Promo */}
          <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-[2rem] bg-(--t1-orange) px-6 py-12 text-center shadow-2xl sm:px-10">
            <div aria-hidden className="absolute -right-16 -top-16 size-48 rounded-full bg-white/15" />
            <div aria-hidden className="absolute -bottom-20 -left-10 size-56 rounded-full bg-(--t1-orange-deep)/40" />
            <div className="relative">
              {loans.promoLines.map((line) => (
                <p
                  key={line}
                  className={`${display} text-[2.5rem] leading-[1.02] font-extrabold uppercase text-white drop-shadow-sm sm:text-5xl`}
                >
                  {line}
                </p>
              ))}
            </div>
            <p className="relative mt-8 grid size-40 place-items-center rounded-full bg-(--t1-teal-deep) p-6 text-base leading-snug font-bold uppercase shadow-xl ring-8 ring-white/20 sm:size-44 sm:text-lg">
              {loans.promoBadge}
            </p>
          </div>

          {/* Partner + offers */}
          <div className="flex min-w-0 flex-col gap-6">
            <div className="flex items-center justify-center rounded-[2rem] bg-white px-6 py-7 shadow-xl sm:py-8">
              {loans.partnerLogoUrl ? (
                <Image
                  unoptimized
                  src={loans.partnerLogoUrl}
                  alt={loans.partnerName}
                  width={600}
                  height={142}
                  className="h-auto w-full max-w-[22rem] object-contain"
                />
              ) : (
                <p className={`${display} text-3xl font-bold italic text-(--t1-crimson)`}>{loans.partnerName}</p>
              )}
            </div>
            <RefundOffers cards={loans.cards} className="flex-1" />
          </div>
        </div>

        {disclaimers.length > 0 && (
          <ol className="mt-10 grid gap-4 rounded-[2rem] bg-(--t1-ink)/45 p-6 text-[0.8rem] leading-relaxed text-white/75 ring-1 ring-inset ring-white/10 sm:p-8 sm:text-sm lg:mt-12">
            {disclaimers.map((d, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <span>{d}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
