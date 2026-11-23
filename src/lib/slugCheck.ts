import "server-only";
import {
  isReservedSlug,
  isValidSlugFormat,
  RESERVED_MESSAGE,
  SLUG_FORMAT_MESSAGE,
  suggestSlug,
  TAKEN_MESSAGE,
  type SlugCheckResponse,
} from "@/lib/slug";
import { isSlugTaken } from "@/lib/sanity/write";

export async function checkSlug(rawSlug: string): Promise<SlugCheckResponse> {
  const slug = rawSlug.trim().toLowerCase();
  if (!isValidSlugFormat(slug)) return { available: false, reason: "invalid", message: SLUG_FORMAT_MESSAGE };
  if (isReservedSlug(slug)) return { available: false, reason: "reserved", message: RESERVED_MESSAGE };
  if (!(await isSlugTaken(slug))) return { available: true };
  const suggestion = await suggestSlug(slug, isSlugTaken);
  return { available: false, reason: "taken", message: TAKEN_MESSAGE, ...(suggestion ? { suggestion } : {}) };
}
