import type { CSSProperties } from "react";

/**
 * Templates 6 and 7 share one layout. A variant sets the palette (as CSS variables), fonts
 * and the few layout differences between the two reference pages.
 */
export interface Variant {
  id: "t6" | "t7";
  /** "split": text left, photo right (T6). "centered": text over a photo background (T7). */
  hero: "split" | "centered";
  /** Highlight cards: on a grey band (T6) or overlapping the hero (T7). */
  highlights: "band" | "overlap";
  /** FAQ in one column (T6) or two (T7). */
  faqColumns: 1 | 2;
  /** Intro cards use image icons (T6) or line icons (T7). */
  introIcons: "image" | "line";
  /** Section backgrounds for intro / services / FAQ / client forms. */
  dark: { intro: boolean; services: boolean; faq: boolean; forms: boolean };
  serviceIcons: [string, string, string];
  formIcons: [string, string];
  theme: CSSProperties;
}

export const T6_VARIANT: Variant = {
  id: "t6",
  hero: "split",
  highlights: "band",
  faqColumns: 1,
  introIcons: "image",
  dark: { intro: true, services: false, faq: true, forms: true },
  serviceIcons: ["/templates/t6/google-docs-1.png", "/templates/t6/notes.png", "/templates/t6/document.png"],
  formIcons: ["/templates/t6/document.png", "/templates/t6/document.png"],
  theme: {
    "--x-dark": "#0B0B0B",
    "--x-dark-2": "#161616",
    "--x-accent": "#FFC107",
    "--x-accent-deep": "#E0A800",
    "--x-on-accent": "#111111",
    "--x-head-light": "#111111",
    "--x-light": "#D8E2E1",
    "--x-band": "#6C757D",
    "--x-font-head": "var(--x-font-body)",
  } as CSSProperties,
};

export const T7_VARIANT: Variant = {
  id: "t7",
  hero: "centered",
  highlights: "overlap",
  faqColumns: 2,
  introIcons: "line",
  dark: { intro: false, services: true, faq: false, forms: true },
  serviceIcons: ["/templates/t6/google-docs-1.png", "/templates/t6/contract.png", "/templates/t6/document-1.png"],
  formIcons: ["/templates/t6/document-1.png", "/templates/t6/contract.png"],
  theme: {
    "--x-dark": "#2C366A",
    "--x-dark-2": "#232B57",
    "--x-accent": "#3A76B4",
    "--x-accent-deep": "#2E5F93",
    "--x-on-accent": "#FFFFFF",
    "--x-head-light": "#2C366A",
    "--x-light": "#DCE3E2",
    "--x-band": "#2C366A",
  } as CSSProperties,
};

export const head = "font-(family-name:--x-font-head)";
export const container = "mx-auto w-full max-w-[1180px] px-5 sm:px-8 xl:px-6";
export const section = "scroll-mt-24 py-16 sm:py-20 lg:py-24";

const btn =
  "group inline-flex min-h-12 items-center justify-center gap-2.5 rounded-lg px-7 py-3 text-center text-sm leading-snug font-semibold tracking-wide uppercase shadow-[0_12px_26px_-14px_rgba(0,0,0,0.55)] transition duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 active:translate-y-0";
export const btnAccent = `${btn} bg-(--x-accent) text-(--x-on-accent) hover:bg-(--x-accent-deep) focus-visible:outline-(--x-accent)`;
export const btnDark = `${btn} bg-(--x-dark) text-white hover:bg-(--x-accent) hover:text-(--x-on-accent) focus-visible:outline-(--x-dark)`;
export const btnArrow = "size-4 transition-transform group-hover:translate-x-0.5";

export { externalProps, isExternal, telHref } from "../t1/theme";
