import type { CSSProperties } from "react";

/**
 * Palette taken from the Template 5 reference page. Template 5 shares Template 3's layout;
 * its accent ("--t5-red" in the shared markup) is gold, with yellow and navy panels.
 */
export const T5_THEME = {
  "--t5-blue": "#678297",
  "--t5-blue-deep": "#4F687B",
  "--t5-red": "#E09900",
  "--t5-red-deep": "#B97C00",
  "--t5-yellow": "#FFD60A",
  "--t5-slate": "#3A506B",
  "--t5-sage": "#9FA8A3",
  "--t5-mauve": "#896A70",
  "--t5-grey": "#D8D4D5",
  "--t5-mist": "#EDF3F3",
  "--t5-ink": "#090303",
  "--t5-mint": "#C5D5CB",
  "--t5-navy": "#283444",
} as CSSProperties;

/** Oswald: headings, menu and small labels. */
export const oswald = "font-(family-name:--t5-font-head)";

export const container = "mx-auto w-full max-w-[1120px] px-5 sm:px-8 xl:px-5";
export const section = "scroll-mt-24 py-16 sm:py-20 lg:py-24";
export const h2 = `${oswald} text-[2.4rem] leading-[1.15] font-medium text-(--t5-blue) sm:text-5xl lg:text-[3.1rem]`;
/** Small spaced capitals used for labels above info. */
export const label = `${oswald} text-sm font-medium tracking-[2px] uppercase`;

const btn =
  "group inline-flex min-h-12 items-center justify-center gap-2.5 rounded-md px-7 py-3 text-center text-[0.8rem] leading-snug font-semibold tracking-[3px] uppercase transition duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 active:translate-y-0 sm:text-sm";
/** Main gold button. */
export const btnRed = `${btn} bg-(--t5-red) text-white shadow-[0_12px_26px_-14px_rgba(224,153,0,0.9)] hover:bg-(--t5-red-deep) focus-visible:outline-(--t5-red)`;
/** Light button for coloured cards. */
export const btnGlass = `${btn} bg-white/15 text-white ring-1 ring-inset ring-white/25 hover:bg-white hover:text-(--t5-ink) focus-visible:outline-white`;
/** Dark button for the client portal and header. */
export const btnNavy = `${btn} bg-(--t5-navy) text-white shadow-[0_12px_26px_-14px_rgba(40,52,68,0.9)] hover:bg-(--t5-red) focus-visible:outline-(--t5-navy)`;

export { externalProps, isExternal, telHref } from "../t1/theme";
