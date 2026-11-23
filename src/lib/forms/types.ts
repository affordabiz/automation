export const FIELD_CATALOG = [
  { type: "short_text", label: "Short text", group: "Text" },
  { type: "long_text", label: "Long text", group: "Text" },
  { type: "email", label: "Email", group: "Text" },
  { type: "phone", label: "Phone", group: "Text" },
  { type: "url", label: "Website URL", group: "Text" },
  { type: "number", label: "Number", group: "Text" },
  { type: "dropdown", label: "Dropdown", group: "Choice" },
  { type: "radio", label: "Single choice", group: "Choice" },
  { type: "checkboxes", label: "Multiple choice", group: "Choice" },
  { type: "consent", label: "Consent checkbox", group: "Choice" },
  { type: "rating", label: "Rating", group: "Choice" },
  { type: "date", label: "Date", group: "Date & time" },
  { type: "time", label: "Time", group: "Date & time" },
  { type: "datetime", label: "Date and time", group: "Date & time" },
  { type: "file", label: "File upload", group: "Advanced" },
  { type: "hidden", label: "Hidden value", group: "Advanced" },
  { type: "heading", label: "Heading", group: "Layout" },
  { type: "paragraph", label: "Paragraph", group: "Layout" },
  { type: "divider", label: "Divider", group: "Layout" },
] as const;

export type FieldType = (typeof FIELD_CATALOG)[number]["type"];

export const LAYOUT_TYPES: readonly FieldType[] = ["heading", "paragraph", "divider"];
export const CHOICE_TYPES: readonly FieldType[] = ["dropdown", "radio", "checkboxes"];

export const LOGIC_OPERATORS = [
  { value: "equals", label: "is" },
  { value: "not_equals", label: "is not" },
  { value: "contains", label: "contains" },
  { value: "not_contains", label: "does not contain" },
  { value: "greater_than", label: "is greater than" },
  { value: "less_than", label: "is less than" },
  { value: "is_empty", label: "is empty" },
  { value: "is_not_empty", label: "is not empty" },
] as const;

export type LogicOperator = (typeof LOGIC_OPERATORS)[number]["value"];

export interface LogicRule {
  fieldId: string;
  operator: LogicOperator;
  value: string;
}

export interface FieldLogic {
  action: "show" | "hide";
  match: "all" | "any";
  rules: LogicRule[];
}

export interface FieldOption {
  id: string;
  label: string;
}

export const FILE_GROUPS = {
  images: { label: "Images", extensions: { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp" } },
  pdf: { label: "PDF", extensions: { pdf: "application/pdf" } },
  documents: {
    label: "Word documents",
    extensions: {
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      txt: "text/plain",
    },
  },
  spreadsheets: {
    label: "Spreadsheets",
    extensions: {
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      csv: "text/csv",
    },
  },
} as const;

export type FileGroup = keyof typeof FILE_GROUPS;

/** Vercel rejects request bodies above about 4.5 MB, so one submission stays under this total. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  minDate?: string;
  maxDate?: string;
  minSelected?: number;
  maxSelected?: number;
  pattern?: string;
  patternMessage?: string;
  fileGroups?: FileGroup[];
  multiple?: boolean;
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  requiredMessage?: string;
  invalidMessage?: string;
  defaultValue?: string;
  width?: "full" | "half";
  options?: FieldOption[];
  validation?: FieldValidation;
  logic?: FieldLogic;
}

export const WEBPAGE_SLOTS = [
  { key: "fullName", label: "Full name", types: ["short_text"] },
  { key: "businessName", label: "Business name", types: ["short_text"] },
  { key: "email", label: "Email", types: ["email"] },
  { key: "phone", label: "Phone", types: ["phone"] },
  { key: "address", label: "Address", types: ["short_text", "long_text"] },
  { key: "servingArea", label: "Serving area", types: ["short_text"] },
  { key: "slug", label: "Web address (slug)", types: ["short_text"] },
  { key: "logo", label: "Logo", types: ["file"] },
  { key: "photo", label: "Photo", types: ["file"] },
] as const satisfies readonly { key: string; label: string; types: readonly FieldType[] }[];

export type WebpageSlot = (typeof WEBPAGE_SLOTS)[number]["key"];

export interface WebpageLink {
  templateNumber: number;
  map: Partial<Record<WebpageSlot, string>>;
}

export interface FormSettings {
  title?: string;
  description?: string;
  submitLabel?: string;
  successTitle?: string;
  successMessage?: string;
  redirectUrl?: string;
  accentColor?: string;
  webpage?: WebpageLink | null;
}

export interface FormSchema {
  fields: FormField[];
  settings: FormSettings;
}

export type FormValue = string | string[];
export type FormValues = Record<string, FormValue>;

export interface FileMeta {
  name: string;
  type: string;
  size: number;
}

export interface StoredFile {
  name: string;
  path: string;
  size: number;
  contentType: string;
}

export interface SubmissionAnswer {
  fieldId: string;
  label: string;
  type: FieldType;
  value: FormValue;
  display: string;
  files?: StoredFile[];
}

export const DEFAULT_ACCENT = "#0f766e";

const uid = (prefix: string) => `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;

export const newOption = (label: string): FieldOption => ({ id: uid("opt"), label });

export function createField(type: FieldType): FormField {
  const label = FIELD_CATALOG.find((f) => f.type === type)?.label ?? "Field";
  const field: FormField = { id: uid("fld"), type, label, width: "full" };
  if (CHOICE_TYPES.includes(type)) field.options = [newOption("Option 1"), newOption("Option 2")];
  if (type === "rating") field.validation = { max: 5 };
  if (type === "file") field.validation = { fileGroups: ["images", "pdf"], multiple: false };
  if (type === "heading") field.label = "Section heading";
  if (type === "paragraph") field.label = "Add helpful text for people filling in this form.";
  if (type === "consent") field.label = "I agree to the terms";
  return field;
}
