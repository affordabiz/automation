import type { ReactNode } from "react";

/** Bold key words and dollar amounts, as on the Refund Advantage artwork. */
const EMPHASIS = /(\bTaxpayer\b|\bRefund\b|\$[\d,]+(?:\.\d+)?)/gi;

export function emphasize(text: string): ReactNode[] {
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

/** Numbers are added by the list, so drop any typed "1." prefix and blank items. */
export function cleanDisclaimers(items: readonly string[]): string[] {
  return items.map((d) => d.replace(/^\s*\d+[.)]\s*/, "").trim()).filter(Boolean);
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

/** The crimson two-offer panel from the Refund Advantage artwork. */
export function RefundOffers({ cards, className = "" }: { cards: readonly { title: string; detail: string }[]; className?: string }) {
  return (
    <div className={`rounded-[2rem] bg-[#C0294F] px-6 py-10 text-white shadow-xl sm:px-10 ${className}`}>
      <div className="grid h-full gap-10 sm:grid-cols-2 sm:gap-0 sm:divide-x sm:divide-white/40">
        {cards.map((c, i) => {
          const Icon = ICONS[i % ICONS.length];
          return (
            <article
              key={c.title}
              className="flex flex-col items-center text-center sm:px-6 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-white/30 [&:not(:first-child)]:pt-10 sm:[&:not(:first-child)]:border-t-0 sm:[&:not(:first-child)]:pt-0"
            >
              <span className="text-[#F6CE2A]">
                <Icon />
              </span>
              <h3 className="mt-6 text-xl leading-snug font-normal uppercase sm:text-2xl">{emphasize(c.title)}</h3>
              <p className="mt-3 text-base leading-snug uppercase text-white/95 sm:text-lg">{emphasize(c.detail)}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
