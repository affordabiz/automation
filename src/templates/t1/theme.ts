import type { CSSProperties } from "react";

export const T1_THEME = {
  "--t1-teal": "#0E5A4E",
  "--t1-teal-deep": "#0A453C",
  "--t1-ink": "#072F29",
  "--t1-orange": "#F7931E",
  "--t1-orange-deep": "#E07B00",
  "--t1-mint": "#EAF3F0",
  "--t1-crimson": "#C0294F",
  "--t1-crimson-deep": "#A11F41",
  "--t1-gold": "#F6CE2A",
} as CSSProperties;

export const display = "font-(family-name:--t1-font-display) tracking-tight";
export const container = "mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10";
export const section = "scroll-mt-20 py-20 sm:py-24 lg:py-32";
/** Section heading: large, tight and readable on every screen. */
export const h2 = `${display} text-[2.25rem] leading-[1.1] font-bold sm:text-5xl lg:text-[3.5rem]`;
export const eyebrow =
  "inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-(--t1-orange) sm:text-sm";

const btn =
  "group inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-7 py-3 text-center text-[0.95rem] font-semibold transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 active:translate-y-px";
export const btnPrimary = `${btn} bg-(--t1-orange) text-white shadow-[0_10px_24px_-10px_rgba(247,147,30,0.8)] hover:-translate-y-0.5 hover:bg-(--t1-orange-deep) hover:shadow-[0_14px_28px_-10px_rgba(224,123,0,0.85)] focus-visible:outline-(--t1-orange)`;
export const btnOutlineLight = `${btn} bg-white/5 text-white ring-1 ring-inset ring-white/35 backdrop-blur hover:-translate-y-0.5 hover:bg-white hover:text-(--t1-teal-deep) focus-visible:outline-white`;
export const btnTeal = `${btn} bg-(--t1-teal) text-white shadow-[0_10px_24px_-12px_rgba(14,90,78,0.9)] hover:-translate-y-0.5 hover:bg-(--t1-teal-deep) focus-visible:outline-(--t1-teal)`;
export const btnOutlineTeal = `${btn} text-(--t1-teal) ring-1 ring-inset ring-(--t1-teal)/30 hover:-translate-y-0.5 hover:bg-(--t1-teal) hover:text-white focus-visible:outline-(--t1-teal)`;
/** Arrow that nudges right when its button is hovered. */
export const btnArrow = "size-4 transition-transform duration-200 group-hover:translate-x-0.5";

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function isExternal(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

export function externalProps(url: string) {
  return isExternal(url) ? { target: "_blank", rel: "noopener noreferrer" } : {};
}
