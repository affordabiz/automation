import type { CSSProperties } from "react";

/** Palette taken from the Template 3 reference page. */
export const T3_THEME = {
  "--t3-blue": "#678297",
  "--t3-blue-deep": "#4F687B",
  "--t3-red": "#D20804",
  "--t3-red-deep": "#A80603",
  "--t3-mauve": "#896A70",
  "--t3-grey": "#D8D4D5",
  "--t3-mist": "#EDF3F3",
  "--t3-ink": "#090303",
  "--t3-mint": "#C5D5CB",
  "--t3-navy": "#283444",
} as CSSProperties;

/** Oswald: headings, menu and small labels. */
export const oswald = "font-(family-name:--t3-font-head)";

export const container = "mx-auto w-full max-w-[1120px] px-5 sm:px-8 xl:px-5";
export const section = "scroll-mt-24 py-16 sm:py-20 lg:py-24";
export const h2 = `${oswald} text-[2.4rem] leading-[1.15] font-medium text-(--t3-blue) sm:text-5xl lg:text-[3.1rem]`;
/** Small spaced capitals used for labels above info. */
export const label = `${oswald} text-sm font-medium tracking-[2px] uppercase`;

const btn =
  "group inline-flex min-h-12 items-center justify-center gap-2.5 rounded-md px-7 py-3 text-center text-[0.8rem] leading-snug font-semibold tracking-[3px] uppercase transition duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 active:translate-y-0 sm:text-sm";
/** Main red button. */
export const btnRed = `${btn} bg-(--t3-red) text-white shadow-[0_12px_26px_-14px_rgba(210,8,4,0.9)] hover:bg-(--t3-red-deep) focus-visible:outline-(--t3-red)`;
/** Light button for coloured cards. */
export const btnGlass = `${btn} bg-white/15 text-white ring-1 ring-inset ring-white/25 hover:bg-white hover:text-(--t3-ink) focus-visible:outline-white`;
/** Dark button for the client portal. */
export const btnNavy = `${btn} bg-(--t3-navy) text-white shadow-[0_12px_26px_-14px_rgba(40,52,68,0.9)] hover:bg-(--t3-red) focus-visible:outline-(--t3-navy)`;

export { externalProps, isExternal, telHref } from "../t1/theme";
