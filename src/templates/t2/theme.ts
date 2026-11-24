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

/** Square navy button with wide letter-spacing, as on the reference. */
export const btnNavy = `${display} inline-flex min-h-12 items-center justify-center bg-(--t2-navy) px-8 py-3.5 text-center text-[1.05rem] leading-tight font-black tracking-[2px] text-white uppercase transition duration-200 hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--t2-navy) sm:px-10`;

export { externalProps, isExternal, telHref } from "../t1/theme";
