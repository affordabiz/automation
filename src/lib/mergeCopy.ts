/**
 * Deep-merges CMS copy over code defaults. Only keys present in `base` are kept.
 * Non-empty strings and non-empty arrays from `override` win; everything else falls back.
 */
export function mergeCopy<T>(base: T, override: unknown): T {
  if (override === null || override === undefined) return base;
  if (Array.isArray(base)) {
    return (Array.isArray(override) && override.length > 0 ? override : base) as T;
  }
  if (typeof base === "string") {
    return (typeof override === "string" && override.trim() !== "" ? override : base) as T;
  }
  if (base && typeof base === "object") {
    if (typeof override !== "object" || Array.isArray(override)) return base;
    const src = override as Record<string, unknown>;
    const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    for (const key of Object.keys(out)) out[key] = mergeCopy(out[key], src[key]);
    return out as T;
  }
  return base;
}
