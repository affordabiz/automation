import type { CSSProperties } from "react";

/** Palette taken from the Template 2 reference page. */
export const T2_THEME = {
  "--t2-navy": "#283444",
  "--t2-navy-deep": "#263142",
  "--t2-sage": "#9FA8A3",
  "--t2-mint": "#C5D5CB",
  "--t2-tan": "#DDCCB8",
  "--t2-sand": "#E3E0CF",
  "--t2-cream": "#F9F3E8",
  "--t2-grey": "#777777",
} as CSSProperties;

/** Darker Grotesque: headings and body copy, as on the reference. */
export const display = "font-(family-name:--t2-font-display)";
/** Roboto Slab: hero title and subtitle button. */
export const slab = "font-(family-name:--t2-font-slab)";
/** Source Sans: navigation. */
export const navFont = "font-(family-name:--t2-font-nav)";
/** Open Sans: cash advance subheading and footer. */
export const openSans = "font-(family-name:--t2-font-open)";

export const container = "mx-auto w-full max-w-[1120px] px-5 sm:px-8 xl:px-5";
export const h2 = `${display} text-[2.4rem] leading-[1.05] font-black text-(--t2-navy) sm:text-5xl lg:text-[3.55rem]`;

const btn = `${display} group inline-flex min-h-[3.25rem] items-center justify-center gap-3 rounded-lg px-7 py-3 text-center text-[1.05rem] leading-tight font-black tracking-[1.5px] uppercase shadow-[0_10px_24px_-14px_rgba(40,52,68,0.9)] transition duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 active:translate-y-0 sm:px-9`;
/** Main button: navy, turning tan on hover. */
export const btnNavy = `${btn} bg-(--t2-navy) text-white hover:bg-(--t2-tan) hover:text-(--t2-navy) focus-visible:outline-(--t2-navy)`;
/** Highlight button: tan, turning navy on hover. */
export const btnTan = `${btn} bg-(--t2-tan) text-(--t2-navy) hover:bg-(--t2-navy) hover:text-white focus-visible:outline-(--t2-navy)`;
/** Small arrow chip that sits at the end of a button. */
export const btnChip =
  "grid size-7 shrink-0 place-items-center rounded-md bg-white/15 text-(--t2-tan) transition group-hover:translate-x-0.5 group-hover:bg-(--t2-navy) group-hover:text-white";

export { externalProps, isExternal, telHref } from "../t1/theme";
