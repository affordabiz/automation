/** Adds the `_key` Sanity requires on every object inside an array. Pure; relative imports only (used by scripts). */
export function withKeys<T>(value: T, prefix = "k"): T {
  if (Array.isArray(value)) {
    return value.map((item, i) => {
      const inner = withKeys(item, `${prefix}${i}-`);
      return inner && typeof inner === "object" && !Array.isArray(inner)
        ? { _key: `${prefix}${i}`, ...inner }
        : inner;
    }) as T;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, withKeys(v, `${prefix}${k}-`)]),
    ) as T;
  }
  return value;
}
