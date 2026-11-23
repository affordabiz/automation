"use client";

import { useCallback, useEffect, useState } from "react";
import {
  isReservedSlug,
  isValidSlugFormat,
  RESERVED_MESSAGE,
  SLUG_FORMAT_MESSAGE,
  TAKEN_MESSAGE,
  type SlugCheckResponse,
} from "@/lib/slug";

export type SlugStatus =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "available" }
  | { state: "taken"; message: string; suggestion?: string }
  | { state: "invalid"; message: string }
  | { state: "error" };

export function localSlugStatus(slug: string): SlugStatus | null {
  if (!slug) return { state: "idle" };
  if (!isValidSlugFormat(slug)) return { state: "invalid", message: SLUG_FORMAT_MESSAGE };
  if (isReservedSlug(slug)) return { state: "invalid", message: RESERVED_MESSAGE };
  return null;
}

/**
 * Checks the slug as soon as the user types (debounced) and immediately on blur via `checkNow`.
 * Results are stored per slug, so a late response for an older value never overrides the current one.
 */
export function useSlugAvailability(slug: string, delayMs = 400) {
  const [remote, setRemote] = useState<{ slug: string; status: SlugStatus } | null>(null);

  const check = useCallback(async (value: string) => {
    if (localSlugStatus(value)) return;
    try {
      const res = await fetch(`/api/slug-available?slug=${encodeURIComponent(value)}`, { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const body = (await res.json()) as SlugCheckResponse;
      const status: SlugStatus = body.available
        ? { state: "available" }
        : body.reason === "taken"
          ? { state: "taken", message: body.message, suggestion: body.suggestion }
          : { state: "invalid", message: body.message };
      setRemote({ slug: value, status });
    } catch {
      setRemote({ slug: value, status: { state: "error" } });
    }
  }, []);

  useEffect(() => {
    if (localSlugStatus(slug)) return;
    const timer = setTimeout(() => void check(slug), delayMs);
    return () => clearTimeout(timer);
  }, [slug, delayMs, check]);

  const local = localSlugStatus(slug);
  const status: SlugStatus = local ?? (remote?.slug === slug ? remote.status : { state: "checking" });

  return {
    status,
    checkNow: () => void check(slug),
    markTaken: (suggestion?: string) =>
      setRemote({ slug, status: { state: "taken", message: TAKEN_MESSAGE, suggestion } }),
  };
}
