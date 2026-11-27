import { REDIRECT_SLUGS } from "./legacyRedirects";

export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,48}[a-z0-9])$/;

/** Site pages carried over from WordPress at their original addresses. */
export const SITE_PAGE_SLUGS = [
  "intake", "intake2", "getstarted", "get-started-here", "report-paid-upfront",
  "privacy-policy-2", "term-condition", "cheatsheets", "compliance",
] as const;

export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  "studio", "api", "create", "templates", "_next", "admin", "embed", "pay", "files", "site", "samples",
  "favicon.ico", "robots.txt", "sitemap.xml",
  ...SITE_PAGE_SLUGS,
  ...REDIRECT_SLUGS,
]);

export const SLUG_FORMAT_MESSAGE =
  "Use 3–50 lowercase letters, numbers or single hyphens (no hyphen at the start or end).";
export const RESERVED_MESSAGE = "This address is reserved — please choose a different one.";
export const TAKEN_MESSAGE = "This address is already taken — please choose a different one.";

export type SlugCheckResponse =
  | { available: true }
  | {
      available: false;
      reason: "invalid" | "reserved" | "taken";
      message: string;
      suggestion?: string;
    };

export function isValidSlugFormat(s: string): boolean {
  return SLUG_PATTERN.test(s) && !s.includes("--");
}

export function isReservedSlug(s: string): boolean {
  return RESERVED_SLUGS.has(s);
}

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
    .replace(/-+$/, "");
}

export async function suggestSlug(
  base: string,
  isTaken: (s: string) => Promise<boolean>,
  max = 20,
): Promise<string | undefined> {
  const root = base.slice(0, 46).replace(/-+$/, "");
  for (let n = 2; n <= max; n++) {
    const candidate = `${root}-${n}`;
    if (!isValidSlugFormat(candidate) || isReservedSlug(candidate)) continue;
    if (!(await isTaken(candidate))) return candidate;
  }
  return undefined;
}
