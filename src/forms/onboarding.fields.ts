/**
 * Single source of truth for the onboarding form. A future form builder can
 * load this array from Sanity instead of code without changing consumers.
 */
export type FieldType = "text" | "email" | "tel" | "textarea" | "slug" | "template" | "image";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  maxLength?: number;
  placeholder?: string;
  help?: string;
  autoComplete?: string;
  accept?: readonly string[];
  maxBytes?: number;
  /** which template value this field fills */
  templateSlot?: string;
}

const MB5 = 5 * 1024 * 1024;

export const ONBOARDING_FIELDS = [
  { name: "fullName", label: "Full name", type: "text", maxLength: 100, autoComplete: "name", templateSlot: "fullName" },
  { name: "businessName", label: "Business name", type: "text", maxLength: 120, autoComplete: "organization", templateSlot: "businessName" },
  {
    name: "email", label: "Email", type: "email", maxLength: 254, autoComplete: "email",
    help: "We'll send your webpage link here. Messages from your webpage's contact form come here too.",
    templateSlot: "email",
  },
  { name: "phone", label: "Phone", type: "tel", maxLength: 20, autoComplete: "tel", templateSlot: "phone" },
  { name: "address", label: "Business address", type: "textarea", maxLength: 200, autoComplete: "street-address", templateSlot: "address" },
  {
    name: "servingArea", label: "Serving area", type: "text", maxLength: 120,
    placeholder: "e.g. Atlanta & Surrounding States", templateSlot: "servingArea",
  },
  { name: "slug", label: "Web address", type: "slug", maxLength: 50 },
  { name: "templateNumber", label: "Template", type: "template" },
  {
    name: "logo", label: "Logo", type: "image",
    accept: ["image/png", "image/jpeg", "image/webp", "image/svg+xml"], maxBytes: MB5, templateSlot: "logoUrl",
  },
  {
    name: "photo", label: "Your photo", type: "image",
    accept: ["image/png", "image/jpeg", "image/webp"], maxBytes: MB5, templateSlot: "photoUrl",
  },
] as const satisfies readonly FieldDef[];

export type OnboardingFieldName = (typeof ONBOARDING_FIELDS)[number]["name"];
