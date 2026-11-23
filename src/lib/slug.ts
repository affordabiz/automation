export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,48}[a-z0-9])$/;

export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  "studio", "api", "create", "templates", "_next", "admin",
  "favicon.ico", "robots.txt", "sitemap.xml",
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
