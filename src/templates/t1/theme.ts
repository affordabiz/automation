import type { CSSProperties } from "react";

export const T1_THEME = {
  "--t1-teal": "#0E5A4E",
  "--t1-teal-deep": "#0A453C",
  "--t1-orange": "#F7931E",
  "--t1-orange-deep": "#E07B00",
  "--t1-mint": "#EAF3F0",
  "--t1-crimson": "#B5223D",
} as CSSProperties;

export const display = "font-(family-name:--t1-font-display)";
export const container = "mx-auto w-full max-w-7xl px-5 sm:px-8";
export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-(--t1-orange) px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white shadow-sm transition hover:bg-(--t1-orange-deep) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--t1-orange)";
export const btnOutlineLight =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/40 transition hover:bg-white/10";
export const btnTeal =
  "inline-flex items-center justify-center gap-2 rounded-full bg-(--t1-teal) px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-(--t1-teal-deep)";

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function isExternal(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

export function externalProps(url: string) {
  return isExternal(url) ? { target: "_blank", rel: "noopener noreferrer" } : {};
}
