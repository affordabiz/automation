import type { CSSProperties } from "react";

/** Palette sampled from the Template 4 reference page. */
export const T4_THEME = {
  "--t4-crimson": "#C02D51",
  "--t4-cyan": "#06BCC0",
  "--t4-cyan-deep": "#049EA2",
  "--t4-grey": "#9999A1",
  "--t4-tan": "#C19875",
  "--t4-olive": "#5A5949",
  "--t4-slate": "#5C6B73",
  "--t4-mint": "#C5D5CB",
  "--t4-navy": "#283444",
  "--t4-sage": "#9FA8A3",
  "--t4-sand": "#E3E0CF",
  "--t4-cream": "#F9F3E8",
} as CSSProperties;

/** Roboto Slab: headings, body copy and buttons, as on the reference. */
export const display = "font-(family-name:--t4-font-slab)";
export const slab = display;
/** Source Sans: navigation. */
export const navFont = "font-(family-name:--t4-font-nav)";
/** Open Sans: footer. */
export const openSans = "font-(family-name:--t4-font-open)";

export const container = "mx-auto w-full max-w-[1120px] px-5 sm:px-8 xl:px-5";
export const h2 = `${display} text-[2.3rem] leading-[1.1] font-medium sm:text-5xl lg:text-[3.4rem]`;

const btn = `${display} group inline-flex min-h-[3.25rem] items-center justify-center gap-3 rounded-lg px-7 py-3 text-center text-[0.95rem] leading-tight font-semibold tracking-[1.5px] uppercase shadow-[0_10px_24px_-14px_rgba(0,0,0,0.55)] transition duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 active:translate-y-0 sm:px-9`;
/** Main button: cyan, turning crimson on hover. */
export const btnCyan = `${btn} bg-(--t4-cyan) text-white hover:bg-(--t4-crimson) focus-visible:outline-(--t4-cyan)`;
/** Slate button, used on photos. */
export const btnSlate = `${btn} bg-(--t4-slate) text-white hover:bg-(--t4-crimson) focus-visible:outline-(--t4-slate)`;
/** Grey button for the contact form. */
export const btnGrey = `${btn} bg-(--t4-grey) text-white hover:bg-(--t4-cyan) focus-visible:outline-(--t4-grey)`;
/** Dark button for the client portal. */
export const btnNavy = `${btn} bg-(--t4-navy) text-white hover:bg-(--t4-cyan) focus-visible:outline-(--t4-navy)`;

export { externalProps, isExternal, telHref } from "../t1/theme";
