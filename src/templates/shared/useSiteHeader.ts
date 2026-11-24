"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { lockScroll, scrollToHash } from "@/lib/smoothScroll";
import type { LinkItem } from "../types";

export const isHash = (url: string) => url.startsWith("#") && url.length > 1;

/** Below this width the slide-in menu is used instead of the inline nav. */
const DESKTOP_MIN = 1280;

/** Removed from every template on request; older CMS copy may still list it. */
const HIDDEN_BUTTON = /hiree\s*sign\s*-?\s*up/i;

export function visibleButtons(buttons: readonly LinkItem[]): LinkItem[] {
  return buttons.filter((b) => b.label.trim() && b.url.trim() && !HIDDEN_BUTTON.test(b.label));
}

/** Shared header behaviour: scroll shadow, active section, and an accessible mobile menu. */
export function useSiteHeader(nav: readonly LinkItem[]) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const targets = nav
      .filter((l) => isHash(l.url))
      .map((l) => document.querySelector<HTMLElement>(l.url))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(`#${e.target.id}`);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [nav]);

  useEffect(() => {
    if (!open) return;
    const toggle = toggleRef.current;
    lockScroll(true);
    panelRef.current?.querySelector<HTMLElement>("a,button")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onResize = () => window.innerWidth >= DESKTOP_MIN && setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      lockScroll(false);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      toggle?.focus();
    };
  }, [open]);

  function go(e: MouseEvent<HTMLAnchorElement>, url: string) {
    if (!isHash(url)) return;
    e.preventDefault();
    setOpen(false);
    lockScroll(false);
    scrollToHash(url);
  }

  return { open, setOpen, scrolled, active, go, panelRef, toggleRef };
}
