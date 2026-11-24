import Image from "next/image";
import { CalendarDays } from "lucide-react";
import { cleanDisclaimers, RefundOffers } from "../shared/RefundOffers";
import type { TemplateProps } from "../types";
import { container, display, section } from "./theme";

export function Loans({ copy }: TemplateProps) {
  const { loans } = copy;
  const disclaimers = cleanDisclaimers(loans.disclaimers);
  return (
    <section id="cash-advance" className={`${section} relative overflow-hidden bg-(--t2-navy-deep) text-white`}>
      {/* Faint oversized wordmark from the reference design. */}
      <p
        aria-hidden
        className={`${display} pointer-events-none absolute -bottom-[0.18em] left-1/2 -translate-x-1/2 text-[22vw] leading-none font-black whitespace-nowrap text-(--t2-tan)/[0.06] select-none`}
      >
        Future
      </p>
      <div className={`${container} relative`}>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="min-w-0">
            <h2 className={`${display} text-[3rem] leading-[0.9] font-black text-(--t2-tan) sm:text-7xl lg:text-[5.25rem]`}>
              {loans.heading}
            </h2>
            {loans.subheading && (
              <p className="mt-7 flex items-start gap-3 text-xl font-bold text-white sm:text-2xl">
                <CalendarDays className="mt-1 size-6 shrink-0 text-(--t2-tan)" aria-hidden />
                {loans.subheading}
              </p>
            )}
          </div>
          <div className="flex items-center justify-center rounded-[2rem] border-[6px] border-white/10 bg-white px-6 py-8 shadow-[0_25px_85px_-15px_rgba(0,0,0,0.5)]">
            {loans.partnerLogoUrl ? (
              <Image
                unoptimized
                src={loans.partnerLogoUrl}
                alt={loans.partnerName}
                width={600}
                height={142}
                className="h-auto w-full max-w-[24rem] object-contain"
              />
            ) : (
              <p className={`${display} text-4xl font-black text-[#C0294F]`}>{loans.partnerName}</p>
            )}
          </div>
        </div>

        <RefundOffers cards={loans.cards} className="mt-10 lg:mt-12" />

        {disclaimers.length > 0 && (
          <div className="mt-10 space-y-4 text-[0.8rem] leading-relaxed text-(--t2-tan)/85 sm:text-sm lg:mt-12">
            {disclaimers.map((d, i) => (
              <p key={i}>
                {i + 1}. {d}
              </p>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
