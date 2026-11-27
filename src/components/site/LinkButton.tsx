import { ArrowUpRight, Download } from "lucide-react";
import type { ReactNode } from "react";

/** Colours used by the buttons on the old TaxPrep.me pages. */
export const BUTTON_TONES = {
  yellow: "bg-[#FFC107] text-black hover:bg-[#F0B400]",
  red: "bg-[#FF0D2A] text-white hover:bg-[#E0001C]",
  black: "bg-black text-white hover:bg-neutral-800",
  purple: "bg-[#940076] text-white hover:bg-[#7A0061]",
  green: "bg-[#1ACD31] text-black hover:bg-[#14B329]",
  blue: "bg-[#0074A9] text-white hover:bg-[#005F8B]",
} as const;

export type ButtonTone = keyof typeof BUTTON_TONES;

export function LinkButton({
  href,
  tone,
  children,
  download = false,
  className = "",
}: {
  href: string;
  tone: ButtonTone;
  children: ReactNode;
  download?: boolean;
  className?: string;
}) {
  const external = /^https?:\/\//.test(href) || href.startsWith("mailto:");
  const Icon = download ? Download : ArrowUpRight;
  return (
    <a
      href={href}
      {...(external || download ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`group inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-center text-[0.95rem] font-semibold shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 active:translate-y-0 sm:text-base ${BUTTON_TONES[tone]} ${className}`}
    >
      {download && <Icon className="size-4 shrink-0" aria-hidden />}
      <span>{children}</span>
      {!download && <Icon className="size-4 shrink-0 opacity-70 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />}
    </a>
  );
}
