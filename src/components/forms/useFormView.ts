"use client";

import { useEffect } from "react";

/** Records one view of a public form per browser session. */
export function useFormView(slug: string, enabled = true) {
  useEffect(() => {
    if (!enabled || !slug) return;
    const key = `form-viewed:${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Storage blocked: still count the view.
    }
    void fetch("/api/form-views", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug }),
      keepalive: true,
    }).catch(() => {});
  }, [slug, enabled]);
}
