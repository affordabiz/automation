import Image from "next/image";
import { cleanDisclaimers, RefundOffers } from "../shared/RefundOffers";
import type { TemplateProps } from "../types";
import { container, head, section } from "./variant";

/** "AVAILABLE Starting January 2": the first word is highlighted, as on the reference. */
function Badge({ text }: { text: string }) {
  const [first, ...rest] = text.split(" ");
  return (
    <p className="mt-3 text-base text-white/90 sm:text-lg">
      <strong className="font-bold text-(--x-accent)">{first}</strong> {rest.join(" ")}
    </p>
  );
}

export function CashAdvance({ copy }: TemplateProps) {
  const { loans } = copy;
  const disclaimers = cleanDisclaimers(loans.disclaimers);
  const hasPromo = loans.promoLines.length > 0;
  return (
    <section id="cash-advance" className={`${section} bg-(--x-light)`}>
      <div className={container}>
        <div className="mx-auto w-full max-w-md rounded-2xl bg-white px-6 py-5 shadow-[0_18px_40px_-26px_rgba(0,0,0,0.6)]">
          <Image unoptimized src={loans.partnerLogoUrl} alt={loans.partnerName} width={600} height={142} className="h-auto w-full object-contain" />
        </div>

        <div className={`mt-10 grid items-start gap-8 ${hasPromo ? "lg:grid-cols-[0.95fr_1.05fr] lg:gap-12" : ""}`}>
          <div className="space-y-5">
            {hasPromo && (
              <div className="rounded-2xl bg-(--x-dark) px-7 py-8 shadow-[0_0_60px_-10px_rgba(255,193,7,0.45)]">
                {loans.promoLines.map((line) => (
                  <p key={line} className={`${head} text-3xl leading-tight font-bold tracking-wide text-white uppercase sm:text-4xl`}>
                    {line}
                  </p>
                ))}
                {loans.promoBadge && <Badge text={loans.promoBadge} />}
              </div>
            )}
            <RefundOffers compact={hasPromo} cards={loans.cards} />
          </div>

          {disclaimers.length > 0 && (
            <div className={`relative space-y-4 rounded-2xl bg-white/70 p-6 text-[0.85rem] leading-relaxed text-[#333] ring-1 ring-black/5 sm:p-8 ${hasPromo ? "" : "lg:mx-auto lg:max-w-5xl"}`}>
              <Image unoptimized src="/templates/t6/arrow.png" alt="" width={56} height={40} className="h-9 w-auto opacity-80" />
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
