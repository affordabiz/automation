import Image from "next/image";
import type { ReactNode } from "react";
import type { TemplateProps } from "../types";
import { container, display, section } from "./theme";

/** Bold key words and dollar amounts, as on the Refund Advantage artwork. */
const EMPHASIS = /(\bTaxpayer\b|\bRefund\b|\$[\d,]+(?:\.\d+)?)/gi;

function emphasize(text: string): ReactNode[] {
  return text.split(EMPHASIS).map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-extrabold">
        {part}
      </strong>
    ) : (
      part
    ),
  );
}

function HandPercentIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="size-16 sm:size-20">
      <circle cx="34" cy="20" r="13" strokeDasharray="5 4" />
      <path d="M29 26l10-12" />
      <circle cx="29.5" cy="15.5" r="2" />
      <circle cx="38.5" cy="24.5" r="2" />
      <path d="M6 48l9-8c2-2 5-3 8-3h12a3.5 3.5 0 010 7H26" />
      <path d="M35 44l12-7a4 4 0 014 6.5L38 53c-2 1.5-4 2-6.5 2H16l-6 4" />
    </svg>
  );
}

function CyclePercentIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="size-16 sm:size-20">
      <circle cx="32" cy="32" r="13" strokeDasharray="5 4" />
      <path d="M27 38l10-12" />
      <circle cx="27.5" cy="27.5" r="2" />
      <circle cx="36.5" cy="36.5" r="2" />
      <path d="M12 26a21 21 0 0134-12" />
      <path d="M46 6v8h-8" />
      <path d="M52 38a21 21 0 01-34 12" />
      <path d="M18 58v-8h8" />
    </svg>
  );
}

const ICONS = [HandPercentIcon, CyclePercentIcon];

export function Loans({ copy }: TemplateProps) {
  const { loans } = copy;
  // Numbers are added by the list, so drop any typed "1." prefix.
  const disclaimers = loans.disclaimers.map((d) => d.replace(/^\s*\d+[.)]\s*/, "").trim()).filter(Boolean);
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

            <div className="flex-1 rounded-[2rem] bg-(--t1-crimson) px-6 py-10 shadow-xl sm:px-10">
              <div className="grid h-full gap-10 sm:grid-cols-2 sm:gap-0 sm:divide-x sm:divide-white/40">
                {loans.cards.map((c, i) => {
                  const Icon = ICONS[i % ICONS.length];
                  return (
                    <article
                      key={c.title}
                      className="flex flex-col items-center text-center sm:px-6 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-white/30 [&:not(:first-child)]:pt-10 sm:[&:not(:first-child)]:border-t-0 sm:[&:not(:first-child)]:pt-0"
                    >
                      <span className="text-(--t1-gold)">
                        <Icon />
                      </span>
                      <h3 className="mt-6 text-xl leading-snug font-normal uppercase sm:text-2xl">{emphasize(c.title)}</h3>
                      <p className="mt-3 text-base leading-snug uppercase text-white/95 sm:text-lg">{emphasize(c.detail)}</p>
                    </article>
                  );
                })}
              </div>
            </div>
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
