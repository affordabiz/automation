import type { CSSProperties } from "react";

/** Palette taken from the Template 2 reference page. */
export const T2_THEME = {
  "--t2-navy": "#283444",
  "--t2-navy-deep": "#1C2532",
  "--t2-sage": "#9FA8A3",
  "--t2-mint": "#C5D5CB",
  "--t2-tan": "#DDCCB8",
  "--t2-sand": "#E3E0CF",
  "--t2-cream": "#F9F3E8",
} as CSSProperties;

export const display = "font-(family-name:--t2-font-display) tracking-tight";
export const container = "mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10";
export const section = "scroll-mt-20 py-20 sm:py-24 lg:py-28";
export const h2 = `${display} text-[2.6rem] leading-[0.95] font-black sm:text-6xl lg:text-7xl`;

const btn =
  "group inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-7 py-3 text-center text-[0.95rem] font-semibold tracking-wide transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 active:translate-y-px";
/** Navy button for light backgrounds. */
export const btnNavy = `${btn} bg-(--t2-navy) text-white shadow-[0_12px_26px_-14px_rgba(40,52,68,0.9)] hover:-translate-y-0.5 hover:bg-(--t2-navy-deep) focus-visible:outline-(--t2-navy)`;
/** Tan button for dark backgrounds. */
export const btnTan = `${btn} bg-(--t2-tan) text-(--t2-navy) shadow-[0_12px_26px_-14px_rgba(0,0,0,0.6)] hover:-translate-y-0.5 hover:bg-white focus-visible:outline-(--t2-tan)`;
export const btnOutlineNavy = `${btn} text-(--t2-navy) ring-2 ring-inset ring-(--t2-navy) hover:-translate-y-0.5 hover:bg-(--t2-navy) hover:text-white focus-visible:outline-(--t2-navy)`;
export const btnArrow = "size-4 transition-transform duration-200 group-hover:translate-x-0.5";

export { externalProps, isExternal, telHref } from "../t1/theme";
