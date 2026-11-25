import Image from "next/image";
import { cleanDisclaimers, RefundOffers } from "../shared/RefundOffers";
import type { TemplateProps } from "../types";
import { container, display, openSans } from "./theme";

export function Loans({ copy }: TemplateProps) {
  const { loans } = copy;
  const disclaimers = cleanDisclaimers(loans.disclaimers);
  return (
    <section id="cash-advance" className="relative scroll-mt-20 overflow-hidden bg-(--t4-grey) pb-16 text-white lg:pb-20">
      <div className={`${container} relative`}>
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="pt-14 lg:pt-20">
            <h2 className={`${display} text-[2.5rem] leading-[1.12] font-semibold sm:text-5xl lg:text-[3.3rem]`}>{loans.heading}</h2>
            {loans.subheading && (
              <p className={`${openSans} mt-7 text-xl leading-[1.65] font-bold sm:text-[1.4rem]`}>{loans.subheading}</p>
            )}
          </div>
          <div className="lg:-mt-3">
            <div className="overflow-hidden rounded-xl border-[5px] border-[#333] bg-white shadow-[0_25px_85px_-15px_rgba(0,0,0,0.3)]">
              {loans.partnerLogoUrl ? (
                <Image
                  unoptimized
                  src={loans.partnerLogoUrl}
                  alt={loans.partnerName}
                  width={600}
                  height={142}
                  className="h-auto w-full object-contain"
                />
              ) : (
                <p className={`${display} p-6 text-center text-4xl font-black text-[#C0294F]`}>{loans.partnerName}</p>
              )}
            </div>
            <RefundOffers compact cards={loans.cards} className="mt-3 rounded-xl! px-4! py-8! shadow-none! sm:px-6!" />
          </div>
        </div>

        <div className="mt-14 grid gap-12 lg:grid-cols-2 lg:gap-14">
          <div className="relative self-start">
            <div className="relative aspect-[502/320] overflow-hidden rounded-xl border-[5px] border-[#333]">
              <Image
                unoptimized
                fill
                src="/templates/t4/cash-advance.jpg"
                alt=""
                className="object-cover"
                sizes="(min-width: 1024px) 32rem, 90vw"
              />
            </div>
            <svg
              aria-hidden
              viewBox="0 0 160 160"
              className="absolute -bottom-20 -left-12 hidden size-36 rotate-[8deg] text-white lg:block"
              fill="none"
            >
              <rect x="6" y="6" width="148" height="148" stroke="#333" strokeWidth="5" />
              <path d="M146 20 C150 70 140 120 92 140 C50 156 18 124 18 84 C18 44 52 18 96 18 Z" stroke="currentColor" strokeWidth="5" />
            </svg>
          </div>
          {disclaimers.length > 0 && (
            <div className="space-y-4 text-[0.92rem] leading-[1.55] font-light text-[#1c1c1c]">
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
