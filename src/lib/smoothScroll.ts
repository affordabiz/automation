import type Lenis from "lenis";

/**
 * Extra anchor offset. Zero because sections already set `scroll-mt-*` for the
 * sticky header, and Lenis honours scroll-margin on its own.
 */
export const HEADER_OFFSET = 0;

let instance: Lenis | null = null;

export function setSmoothScroll(lenis: Lenis | null) {
  instance = lenis;
}

/** Scrolls to an in-page anchor, smoothly when enabled. */
export function scrollToHash(hash: string) {
  const target = document.querySelector<HTMLElement>(hash);
  if (!target) return;
  if (instance) instance.scrollTo(target, { offset: HEADER_OFFSET, force: true });
  else target.scrollIntoView({ behavior: "smooth", block: "start" });
  history.replaceState(null, "", hash);
}

/** Freezes page scrolling while an overlay (like the mobile menu) is open. */
export function lockScroll(locked: boolean) {
  document.documentElement.style.overflow = locked ? "hidden" : "";
  if (locked) instance?.stop();
  else instance?.start();
}
