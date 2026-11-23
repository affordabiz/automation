import { z } from "zod";
import { isLiveTemplate } from "@/templates/catalog";
import { isInputField, isSafePattern } from "./engine";
import {
  CHOICE_TYPES,
  FIELD_CATALOG,
  FILE_GROUPS,
  LOGIC_OPERATORS,
  WEBPAGE_SLOTS,
  type FieldType,
  type FormSchema,
} from "./types";

const short = (max: number) => z.string().max(max).optional();
const id = z.string().regex(/^[a-z]+_?[a-zA-Z0-9]{0,40}$/);
const count = z.number().int().min(0).max(100000).optional();

const fieldSchema = z.object({
  id,
  type: z.enum(FIELD_CATALOG.map((f) => f.type) as [FieldType, ...FieldType[]]),
  label: z.string().trim().min(1, "Every field needs a label.").max(500),
  placeholder: short(200),
  helpText: short(500),
  required: z.boolean().optional(),
  requiredMessage: short(200),
  invalidMessage: short(200),
  defaultValue: short(1000),
  width: z.enum(["full", "half"]).optional(),
  options: z.array(z.object({ id, label: z.string().trim().min(1, "Options can't be empty.").max(200) })).max(100).optional(),
  validation: z
    .object({
      minLength: count,
      maxLength: count,
      min: z.number().finite().optional(),
      max: z.number().finite().optional(),
      minDate: short(16),
      maxDate: short(16),
      minSelected: count,
      maxSelected: count,
      pattern: short(200),
      patternMessage: short(200),
      fileGroups: z.array(z.enum(Object.keys(FILE_GROUPS) as [keyof typeof FILE_GROUPS])).optional(),
      multiple: z.boolean().optional(),
    })
    .optional(),
  logic: z
    .object({
      action: z.enum(["show", "hide"]),
      match: z.enum(["all", "any"]),
      rules: z
        .array(
          z.object({
            fieldId: id,
            operator: z.enum(LOGIC_OPERATORS.map((o) => o.value) as [(typeof LOGIC_OPERATORS)[number]["value"]]),
            value: z.string().max(500),
          }),
        )
        .max(10),
    })
    .optional(),
});

const settingsSchema = z.object({
  title: short(150),
  description: short(1000),
  submitLabel: short(50),
  successTitle: short(120),
  successMessage: short(1000),
  redirectUrl: z
    .string()
    .max(1000)
    .refine((value) => {
      if (!value) return true;
      try {
        return new URL(value).protocol === "https:";
      } catch {
        return false;
      }
    }, "The redirect URL must start with https://.")
    .optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Choose a valid color.").optional(),
  webpage: z
    .object({
      templateNumber: z.number().int(),
      map: z.partialRecord(z.enum(WEBPAGE_SLOTS.map((s) => s.key) as [(typeof WEBPAGE_SLOTS)[number]["key"]]), z.string().max(60)),
    })
    .nullable()
    .optional(),
});

const formSchema = z.object({ fields: z.array(fieldSchema).max(100, "Forms can have up to 100 fields."), settings: settingsSchema });

export type ParsedSchema = { ok: true; schema: FormSchema } | { ok: false; error: string };

export function parseFormSchema(raw: unknown): ParsedSchema {
  const parsed = formSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "This form isn't valid." };
  const schema = parsed.data as FormSchema;

  const seen = new Set<string>();
  for (const field of schema.fields) {
    if (seen.has(field.id)) return { ok: false, error: "Two fields have the same ID." };
    if (field.validation?.pattern && !isSafePattern(field.validation.pattern)) {
      return { ok: false, error: `The format pattern on "${field.label}" is invalid or unsafe.` };
    }
    for (const rule of field.logic?.rules ?? []) {
      if (!seen.has(rule.fieldId)) {
        return { ok: false, error: `Logic on "${field.label}" must depend on a question above it.` };
      }
    }
    seen.add(field.id);
  }
  return { ok: true, schema };
}

/** Checks that only matter once real people can submit the form. */
export function publishProblems(schema: FormSchema): string[] {
  const problems: string[] = [];
  const inputs = schema.fields.filter((f) => isInputField(f) && f.type !== "hidden");
  if (inputs.length === 0) problems.push("Add at least one question.");

  for (const field of schema.fields) {
    if (CHOICE_TYPES.includes(field.type) && (field.options?.length ?? 0) < 1) {
      problems.push(`Add at least one option to "${field.label}".`);
    }
  }

  const webpage = schema.settings.webpage;
  if (webpage) {
    if (!isLiveTemplate(webpage.templateNumber)) problems.push("Choose an available template.");
    for (const slot of WEBPAGE_SLOTS) {
      const field = schema.fields.find((f) => f.id === webpage.map[slot.key]);
      if (!field) problems.push(`Connect a field to "${slot.label}".`);
      else if (!(slot.types as readonly FieldType[]).includes(field.type)) problems.push(`"${field.label}" can't be used for ${slot.label}.`);
      else if (!field.required || field.logic?.rules.length) problems.push(`"${field.label}" must be required and always visible.`);
      else if (field.type === "file" && (field.validation?.multiple || field.validation?.fileGroups?.join() !== "images")) {
        problems.push(`"${field.label}" must accept one image only.`);
      }
    }
  }
  return problems;
}
