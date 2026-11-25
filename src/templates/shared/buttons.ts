import type { LinkItem } from "../types";

/** Never shown on any template, by request; older CMS copy may still list it. */
const SIGNUP_BUTTON = /hiree?\s*sign\s*-?\s*up/i;

export function visibleButtons(buttons: readonly LinkItem[]): LinkItem[] {
  return buttons.filter((b) => b.label.trim() && b.url.trim() && !SIGNUP_BUTTON.test(b.label));
}
