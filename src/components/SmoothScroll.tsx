"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { HEADER_OFFSET, setSmoothScroll } from "@/lib/smoothScroll";

/** Areas with their own scroll containers keep native scrolling. */
const NATIVE = /^\/(admin|studio)(\/|$)/;

export function SmoothScroll() {
  const pathname = usePathname();
  const enabled = !NATIVE.test(pathname);

  useEffect(() => {
    if (!enabled || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.1,
      anchors: { offset: HEADER_OFFSET },
      allowNestedScroll: true,
    });
    setSmoothScroll(lenis);
    return () => {
      setSmoothScroll(null);
      lenis.destroy();
    };
  }, [enabled]);

  return null;
}
