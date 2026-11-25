import Image from "next/image";
import { cleanDisclaimers, RefundOffers } from "../shared/RefundOffers";
import type { TemplateProps } from "../types";
import { container, h2, oswald } from "./theme";

export function CashAdvance({ copy }: TemplateProps) {
  const { loans } = copy;
  const disclaimers = cleanDisclaimers(loans.disclaimers);
  return (
    <section id="cash-advance" className="scroll-mt-24 bg-(--t5-grey) pt-16 pb-28 sm:pt-20 lg:pb-36">
      <div className={container}>
        <div className="text-center">
          <h2 className={`${h2} text-(--t5-slate)!`}>{loans.heading}</h2>
          {loans.subheading && <p className="mt-2 text-[0.95rem] font-bold text-(--t5-ink)">{loans.subheading}</p>}
        </div>
        <div className="mt-8 rounded-xl bg-white px-5 py-10 sm:px-10 lg:px-[10%] lg:py-12">
          <div className="mx-auto max-w-md overflow-hidden rounded-lg border-[5px] border-[#333] bg-white">
            {loans.partnerLogoUrl ? (
              <Image unoptimized src={loans.partnerLogoUrl} alt={loans.partnerName} width={600} height={142} className="h-auto w-full object-contain" />
            ) : (
              <p className={`${oswald} p-6 text-center text-4xl text-(--t5-red)`}>{loans.partnerName}</p>
            )}
          </div>
          <RefundOffers cards={loans.cards} className="mt-4 rounded-lg! shadow-none!" />
          {disclaimers.length > 0 && (
            <div className="mx-auto mt-8 max-w-3xl space-y-3 text-justify text-[0.72rem] leading-[1.6] text-[#555] sm:text-xs">
              {disclaimers.map((d, i) => (
                <p key={i}>
                  {i + 1}. {d}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
