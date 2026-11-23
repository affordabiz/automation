import { describe, expect, it } from "vitest";
import { csvCell, displayValue, isSafePattern, ruleMatches, validateField, validateForm, visibleFieldIds } from "./engine";
import { parseFormSchema, publishProblems } from "./definition";
import type { FormField, FormSchema } from "./types";

const text = (id: string, extra: Partial<FormField> = {}): FormField => ({ id, type: "short_text", label: id, ...extra });
const choice: FormField = {
  id: "kind",
  type: "radio",
  label: "Kind",
  required: true,
  options: [{ id: "a", label: "Business" }, { id: "b", label: "Personal" }],
};

describe("conditional logic", () => {
  const dependent = text("company", {
    required: true,
    logic: { action: "show", match: "all", rules: [{ fieldId: "kind", operator: "equals", value: "a" }] },
  });

  it("shows a field only when its rule matches", () => {
    expect(visibleFieldIds([choice, dependent], { kind: "b" }).has("company")).toBe(false);
    expect(visibleFieldIds([choice, dependent], { kind: "a" }).has("company")).toBe(true);
  });

  it("does not require hidden fields", () => {
    expect(validateForm([choice, dependent], { kind: "b" }).errors).toEqual({});
    expect(validateForm([choice, dependent], { kind: "a" }).errors.company).toBeDefined();
  });

  it("treats a hidden parent as empty", () => {
    const child = text("child", { logic: { action: "show", match: "all", rules: [{ fieldId: "company", operator: "is_not_empty", value: "" }] } });
    expect(visibleFieldIds([choice, dependent, child], { kind: "b", company: "stale" }).has("child")).toBe(false);
  });

  it("supports hide rules and any matching", () => {
    const field = text("x", {
      logic: {
        action: "hide",
        match: "any",
        rules: [{ fieldId: "kind", operator: "equals", value: "a" }, { fieldId: "kind", operator: "equals", value: "b" }],
      },
    });
    expect(visibleFieldIds([choice, field], { kind: "a" }).has("x")).toBe(false);
    expect(visibleFieldIds([choice, field], {}).has("x")).toBe(true);
  });

  it("compares numbers numerically", () => {
    expect(ruleMatches({ fieldId: "n", operator: "greater_than", value: "9" }, "10")).toBe(true);
    expect(ruleMatches({ fieldId: "n", operator: "less_than", value: "9" }, "")).toBe(false);
  });
});

describe("field validation", () => {
  it("uses custom required and invalid messages", () => {
    expect(validateField(text("a", { required: true, requiredMessage: "Need this" }), "")).toBe("Need this");
    expect(validateField({ id: "e", type: "email", label: "E", invalidMessage: "Bad email" }, "nope")).toBe("Bad email");
  });

  it("checks text length and patterns", () => {
    expect(validateField(text("a", { validation: { minLength: 3 } }), "ab")).toContain("at least 3");
    const zip = text("zip", { validation: { pattern: "^\\d{5}$", patternMessage: "Use 5 digits" } });
    expect(validateField(zip, "123")).toBe("Use 5 digits");
    expect(validateField(zip, "12345")).toBeNull();
  });

  it("checks numbers, dates, ratings and URLs", () => {
    expect(validateField({ id: "n", type: "number", label: "N", validation: { min: 5 } }, "2")).toContain("5 or more");
    expect(validateField({ id: "d", type: "date", label: "D", validation: { minDate: "2026-01-01" } }, "2025-12-31")).toContain("or later");
    expect(validateField({ id: "r", type: "rating", label: "R", validation: { max: 5 } }, "6")).toBeTruthy();
    expect(validateField({ id: "u", type: "url", label: "U" }, "javascript:alert(1)")).toBeTruthy();
  });

  it("rejects options that are not on the form", () => {
    expect(validateField(choice, "forged")).toBeTruthy();
    const many: FormField = { ...choice, type: "checkboxes", validation: { maxSelected: 1 } };
    expect(validateField(many, ["a", "b"])).toContain("at most 1");
  });

  it("blocks unsafe and oversized files", () => {
    const file: FormField = { id: "f", type: "file", label: "F", validation: { fileGroups: ["pdf"] } };
    expect(validateField(file, undefined, [{ name: "x.html", type: "text/html", size: 10 }])).toBeTruthy();
    expect(validateField(file, undefined, [{ name: "x.pdf", type: "text/html", size: 10 }])).toBeTruthy();
    expect(validateField(file, undefined, [{ name: "x.pdf", type: "application/pdf", size: 5 * 1024 * 1024 }])).toContain("4 MB");
    expect(validateField(file, undefined, [{ name: "x.pdf", type: "application/pdf", size: 10 }])).toBeNull();
  });

  it("limits the combined upload size", () => {
    const a: FormField = { id: "a", type: "file", label: "A" };
    const b: FormField = { id: "b", type: "file", label: "B" };
    const big = { name: "x.pdf", type: "application/pdf", size: 3 * 1024 * 1024 };
    expect(validateForm([a, b], {}, { a: [big], b: [big] }).errors.b).toContain("together");
  });
});

describe("safety helpers", () => {
  it("rejects dangerous regular expressions", () => {
    expect(isSafePattern("^\\d{5}$")).toBe(true);
    expect(isSafePattern("(a+)+$")).toBe(false);
    expect(isSafePattern("(a)\\1")).toBe(false);
    expect(isSafePattern("[")).toBe(false);
  });

  it("neutralizes spreadsheet formulas", () => {
    expect(csvCell("=SUM(A1)")).toBe(`"'=SUM(A1)"`);
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
  });

  it("shows option labels", () => {
    expect(displayValue(choice, "a")).toBe("Business");
  });
});

describe("form definitions", () => {
  const schema: FormSchema = { fields: [text("a", { required: true })], settings: {} };

  it("accepts a valid schema", () => {
    expect(parseFormSchema(schema).ok).toBe(true);
  });

  it("rejects logic that points at a later field", () => {
    const fields = [
      text("a", { logic: { action: "show", match: "all", rules: [{ fieldId: "b", operator: "is_empty", value: "" }] } }),
      text("b"),
    ];
    expect(parseFormSchema({ fields, settings: {} }).ok).toBe(false);
  });

  it("rejects unsafe redirect URLs and patterns", () => {
    expect(parseFormSchema({ fields: [], settings: { redirectUrl: "javascript:alert(1)" } }).ok).toBe(false);
    expect(parseFormSchema({ fields: [text("a", { validation: { pattern: "(a+)+" } })], settings: {} }).ok).toBe(false);
  });

  it("requires a question before publishing", () => {
    expect(publishProblems({ fields: [{ id: "h", type: "heading", label: "Hi" }], settings: {} })).toHaveLength(1);
    expect(publishProblems(schema)).toEqual([]);
  });

  it("requires complete, required webpage mappings", () => {
    const linked: FormSchema = { ...schema, settings: { webpage: { templateNumber: 1, map: { fullName: "a" } } } };
    expect(publishProblems(linked).length).toBeGreaterThan(0);
  });
});
