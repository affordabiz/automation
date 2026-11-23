import type { SiteData } from "@/templates/types";

export type TokenValues = Record<string, string>;

const TOKEN = /\{\{\s*(\w+)\s*\}\}/g;

export function siteTokenValues(site: SiteData): TokenValues {
  return {
    fullName: site.fullName,
    businessName: site.businessName,
    email: site.email,
    phone: site.phone,
    address: site.address,
    servingArea: site.servingArea,
  };
}

export function resolveString(s: string, values: TokenValues): string {
  return s.replace(TOKEN, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? values[key] : match,
  );
}

export function resolveTokens<T>(value: T, values: TokenValues): T {
  if (typeof value === "string") return resolveString(value, values) as T;
  if (Array.isArray(value)) return value.map((v) => resolveTokens(v, values)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, resolveTokens(v, values)]),
    ) as T;
  }
  return value;
}
