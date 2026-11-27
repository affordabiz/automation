import { z } from "zod";
import { ONBOARDING_FIELDS, type FieldDef } from "./onboarding.fields";
import { isReservedSlug, isValidSlugFormat, RESERVED_MESSAGE, SLUG_FORMAT_MESSAGE } from "@/lib/slug";
import { isLiveTemplate } from "@/templates/catalog";

export interface OnboardingData {
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  address: string;
  servingArea: string;
  slug: string;
  templateNumber: number;
}

export type FieldErrors = Partial<Record<string, string[]>>;

export type OnboardingParseResult =
  | { success: true; data: OnboardingData; logo: File | null; photo: File | null }
  | { success: false; errors: FieldErrors };

const PHONE = /^[+()\d\s.-]{7,20}$/;

function required(def: FieldDef) {
  return z.string().trim().min(1, `${def.label} is required`).max(def.maxLength ?? 500, `${def.label} is too long`);
}

function schemaFor(def: FieldDef): z.ZodType {
  switch (def.type) {
    case "text":
    case "textarea":
      return required(def);
    case "email":
      return required(def).toLowerCase().pipe(z.email("Enter a valid email address"));
    case "tel":
      return required(def).regex(PHONE, "Enter a valid phone number");
    case "slug":
      return z
        .string()
        .trim()
        .toLowerCase()
        .refine(isValidSlugFormat, SLUG_FORMAT_MESSAGE)
        .refine((s) => !isReservedSlug(s), RESERVED_MESSAGE);
    case "template":
      return z.coerce.number().int().refine(isLiveTemplate, "Please pick an available template");
    case "image":
      throw new Error("image fields are validated separately");
  }
}

const TEXT_FIELDS: readonly FieldDef[] = ONBOARDING_FIELDS.filter((f) => f.type !== "image");
const IMAGE_FIELDS: readonly FieldDef[] = ONBOARDING_FIELDS.filter((f) => f.type === "image");

const textSchema = z.object(Object.fromEntries(TEXT_FIELDS.map((f) => [f.name, schemaFor(f)])));

const TYPE_NAMES: Record<string, string> = {
  "image/png": "PNG", "image/jpeg": "JPEG", "image/webp": "WebP", "image/svg+xml": "SVG",
};

export function checkImage(def: FieldDef, value: FormDataEntryValue | null): string | null {
  if (!(value instanceof File) || value.size === 0) return `${def.label} is required`;
  const accept = def.accept ?? [];
  if (!accept.includes(value.type)) {
    const names = accept.map((t) => TYPE_NAMES[t] ?? t);
    return `${def.label} must be ${names.slice(0, -1).join(", ")} or ${names.at(-1)}`;
  }
  if (value.size > (def.maxBytes ?? Infinity)) return `${def.label} must be 5 MB or smaller`;
  return null;
}

/** With `imagesOptional`, a missing logo or photo is allowed (an earlier webpage's image is reused). */
export function parseOnboarding(form: FormData, options: { imagesOptional?: boolean } = {}): OnboardingParseResult {
  const raw = Object.fromEntries(TEXT_FIELDS.map((f) => [f.name, String(form.get(f.name) ?? "")]));
  const parsed = textSchema.safeParse(raw);
  const errors: FieldErrors = parsed.success ? {} : { ...z.flattenError(parsed.error).fieldErrors };

  const files: Record<string, File | null> = {};
  for (const def of IMAGE_FIELDS) {
    const value = form.get(def.name);
    if (options.imagesOptional && !(value instanceof File && value.size > 0)) {
      files[def.name] = null;
      continue;
    }
    const problem = checkImage(def, value);
    if (problem) errors[def.name] = [problem];
    else files[def.name] = value as File;
  }

  if (!parsed.success || Object.keys(errors).length > 0) return { success: false, errors };
  return { success: true, data: parsed.data as unknown as OnboardingData, logo: files.logo, photo: files.photo };
}
