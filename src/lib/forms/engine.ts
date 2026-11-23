import {
  CHOICE_TYPES,
  FILE_GROUPS,
  LAYOUT_TYPES,
  MAX_UPLOAD_BYTES,
  type FileGroup,
  type FileMeta,
  type FormField,
  type FormValue,
  type FormValues,
  type LogicRule,
} from "./types";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^[+()\d\s.-]{7,20}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;
const DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const MAX_TEXT = 10000;

export const isInputField = (f: FormField) => !LAYOUT_TYPES.includes(f.type);

export function isEmptyValue(value: FormValue | undefined): boolean {
  if (value === undefined) return true;
  return Array.isArray(value) ? value.length === 0 : value.trim() === "";
}

/** Rejects patterns that could freeze the page or server on crafted input. */
export function isSafePattern(pattern: string): boolean {
  if (pattern.length > 200) return false;
  if (/\\[1-9]/.test(pattern) || /\([^)]*[+*][^)]*\)\s*[+*{]/.test(pattern)) return false;
  try {
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
}

function compare(left: string, right: string): number {
  const a = Number(left);
  const b = Number(right);
  if (left.trim() !== "" && right.trim() !== "" && Number.isFinite(a) && Number.isFinite(b)) return a - b;
  return left.localeCompare(right);
}

export function ruleMatches(rule: LogicRule, value: FormValue | undefined): boolean {
  const empty = isEmptyValue(value);
  const list = Array.isArray(value) ? value : value ? [value] : [];
  const lower = rule.value.toLowerCase();
  switch (rule.operator) {
    case "is_empty":
      return empty;
    case "is_not_empty":
      return !empty;
    case "equals":
      return list.some((v) => v.toLowerCase() === lower);
    case "not_equals":
      return !list.some((v) => v.toLowerCase() === lower);
    case "contains":
      return list.some((v) => v.toLowerCase().includes(lower));
    case "not_contains":
      return !list.some((v) => v.toLowerCase().includes(lower));
    case "greater_than":
      return !empty && list.some((v) => compare(v, rule.value) > 0);
    case "less_than":
      return !empty && list.some((v) => compare(v, rule.value) < 0);
  }
}

/** Fields are evaluated in order, so a hidden field counts as empty for rules that depend on it. */
export function visibleFieldIds(fields: readonly FormField[], values: FormValues): Set<string> {
  const visible = new Set<string>();
  for (const field of fields) {
    const logic = field.logic;
    if (!logic || logic.rules.length === 0) {
      visible.add(field.id);
      continue;
    }
    const check = (rule: LogicRule) => ruleMatches(rule, visible.has(rule.fieldId) ? values[rule.fieldId] : undefined);
    const matched = logic.match === "all" ? logic.rules.every(check) : logic.rules.some(check);
    if (logic.action === "show" ? matched : !matched) visible.add(field.id);
  }
  return visible;
}

export function allowedExtensions(groups: readonly FileGroup[] | undefined): Record<string, string> {
  const selected = groups && groups.length > 0 ? groups : (Object.keys(FILE_GROUPS) as FileGroup[]);
  return Object.assign({}, ...selected.map((g) => FILE_GROUPS[g].extensions));
}

export function fileExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot < 0 ? "" : name.slice(dot + 1).toLowerCase();
}

function validateFiles(field: FormField, files: readonly FileMeta[]): string | null {
  const invalid = field.invalidMessage;
  if (files.length > 1 && !field.validation?.multiple) return invalid || "Upload one file.";
  if (files.length > 10) return invalid || "Upload 10 files or fewer.";
  const allowed = allowedExtensions(field.validation?.fileGroups);
  for (const file of files) {
    const expected = allowed[fileExtension(file.name)];
    const typeOk = expected && (!file.type || file.type === expected || file.type === "application/octet-stream" || (expected === "text/csv" && file.type === "application/vnd.ms-excel"));
    if (!typeOk) return invalid || `Allowed file types: ${Object.keys(allowed).join(", ").toUpperCase()}.`;
    if (file.size > MAX_UPLOAD_BYTES) return invalid || "Files must be 4 MB or smaller.";
  }
  return null;
}

function validateText(field: FormField, value: string): string | null {
  const v = field.validation ?? {};
  const invalid = field.invalidMessage;
  if (value.length > MAX_TEXT) return invalid || "This answer is too long.";
  if (v.minLength !== undefined && value.length < v.minLength) return invalid || `Enter at least ${v.minLength} characters.`;
  if (v.maxLength !== undefined && value.length > v.maxLength) return invalid || `Enter ${v.maxLength} characters or fewer.`;
  if (v.pattern && isSafePattern(v.pattern) && !new RegExp(v.pattern).test(value)) {
    return v.patternMessage || invalid || "Enter a value in the correct format.";
  }
  return null;
}

function validSelection(field: FormField, value: string): boolean {
  return Boolean(field.options?.some((o) => o.id === value));
}

export function validateField(field: FormField, value: FormValue | undefined, files: readonly FileMeta[] = []): string | null {
  if (!isInputField(field) || field.type === "hidden") return null;
  const missing = field.type === "file" ? files.length === 0 : field.type === "consent" ? value !== "true" : isEmptyValue(value);
  if (missing) return field.required ? field.requiredMessage || "This field is required." : null;

  const invalid = field.invalidMessage;
  const v = field.validation ?? {};
  const text = typeof value === "string" ? value.trim() : "";

  switch (field.type) {
    case "short_text":
    case "long_text":
      return validateText(field, text);
    case "email":
      return EMAIL.test(text) && text.length <= 254 ? validateText(field, text) : invalid || "Enter a valid email address.";
    case "phone":
      return PHONE.test(text) ? validateText(field, text) : invalid || "Enter a valid phone number.";
    case "url":
      try {
        const url = new URL(text);
        if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("protocol");
      } catch {
        return invalid || "Enter a full URL, starting with https://.";
      }
      return validateText(field, text);
    case "number": {
      const n = Number(text);
      if (!Number.isFinite(n)) return invalid || "Enter a valid number.";
      if (v.min !== undefined && n < v.min) return invalid || `Enter ${v.min} or more.`;
      if (v.max !== undefined && n > v.max) return invalid || `Enter ${v.max} or less.`;
      return null;
    }
    case "dropdown":
    case "radio":
      return validSelection(field, text) ? null : invalid || "Choose a valid option.";
    case "checkboxes": {
      const list = Array.isArray(value) ? value : [text];
      if (!list.every((item) => validSelection(field, item))) return invalid || "Choose valid options.";
      if (v.minSelected !== undefined && list.length < v.minSelected) return invalid || `Choose at least ${v.minSelected}.`;
      if (v.maxSelected !== undefined && list.length > v.maxSelected) return invalid || `Choose at most ${v.maxSelected}.`;
      return null;
    }
    case "rating": {
      const n = Number(text);
      return Number.isInteger(n) && n >= 1 && n <= (v.max ?? 5) ? null : invalid || "Choose a rating.";
    }
    case "date":
    case "time":
    case "datetime": {
      const format = field.type === "date" ? DATE : field.type === "time" ? TIME : DATETIME;
      if (!format.test(text)) return invalid || "Enter a valid value.";
      if (v.minDate && text < v.minDate) return invalid || `Choose ${v.minDate.replace("T", " ")} or later.`;
      if (v.maxDate && text > v.maxDate) return invalid || `Choose ${v.maxDate.replace("T", " ")} or earlier.`;
      return null;
    }
    case "file":
      return validateFiles(field, files);
    default:
      return null;
  }
}

export interface ValidationResult {
  errors: Record<string, string>;
  visible: Set<string>;
}

export function validateForm(
  fields: readonly FormField[],
  values: FormValues,
  files: Record<string, readonly FileMeta[]> = {},
): ValidationResult {
  const visible = visibleFieldIds(fields, values);
  const errors: Record<string, string> = {};
  let total = 0;
  let lastFile: string | null = null;
  for (const field of fields) {
    if (!visible.has(field.id)) continue;
    const list = files[field.id] ?? [];
    const error = validateField(field, values[field.id], list);
    if (error) errors[field.id] = error;
    if (list.length > 0) lastFile = field.id;
    total += list.reduce((sum, f) => sum + f.size, 0);
  }
  if (total > MAX_UPLOAD_BYTES && lastFile && !errors[lastFile]) errors[lastFile] = "All files together must be 4 MB or smaller.";
  return { errors, visible };
}

export function displayValue(field: FormField, value: FormValue | undefined): string {
  if (value === undefined) return "";
  const label = (id: string) => field.options?.find((o) => o.id === id)?.label ?? id;
  if (CHOICE_TYPES.includes(field.type)) return (Array.isArray(value) ? value : [value]).map(label).join(", ");
  if (field.type === "consent") return value === "true" ? "Yes" : "No";
  return Array.isArray(value) ? value.join(", ") : value.trim();
}

/** Prevents spreadsheet apps from treating a submitted answer as a formula. */
export function csvCell(value: string): string {
  const safe = /^[\s]*[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}
