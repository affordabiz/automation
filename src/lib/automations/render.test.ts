import { describe, expect, it } from "vitest";
import type { FormField } from "@/lib/forms/types";
import { activationProblems, parseDefinition } from "./definition";
import { automationEmail, conditionsMatch, labelsToTokens, renderSubject, renderText, tokensToLabels } from "./render";
import type { AutomationDefinition } from "./types";

const context = {
  formName: "Intake",
  submittedAt: "Nov 23, 2026",
  answers: [
    { fieldId: "fld_name", label: "Full name", display: "Jane", value: "Jane" },
    { fieldId: "fld_note", label: "Note", display: "{{fld_name}}", value: "{{fld_name}}" },
  ],
};
const fields: FormField[] = [
  { id: "fld_name", type: "short_text", label: "Full name" },
  { id: "fld_mail", type: "email", label: "Email" },
];

describe("email rendering", () => {
  it("fills in answers and built-in variables", () => {
    expect(renderText("Hi {{fld_name}} from {{form_name}}", context)).toBe("Hi Jane from Intake");
    expect(renderText("{{all_answers}}", context)).toContain("Full name: Jane");
  });

  it("does not expand variables typed by a respondent", () => {
    expect(renderText("{{fld_note}}", context)).toBe("{{fld_name}}");
  });

  it("removes line breaks from subjects", () => {
    const injected = { ...context, answers: [{ fieldId: "x", label: "X", display: "a\r\nBcc: evil@example.com", value: "" }] };
    expect(renderSubject("Hi {{x}}", injected)).toBe("Hi a Bcc: evil@example.com");
  });

  it("escapes HTML in email bodies", () => {
    const email = automationEmail("Hello", "<script>alert(1)</script>\nNext");
    expect(email.html).toContain("&lt;script&gt;");
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("<br>Next");
  });

  it("converts between editor labels and stored field IDs", () => {
    expect(tokensToLabels("Hi {{fld_name}} {{form_name}}", fields)).toBe("Hi {{Full name}} {{Form name}}");
    expect(labelsToTokens("Hi {{full name}} {{Form name}}", fields)).toBe("Hi {{fld_name}} {{form_name}}");
  });
});

describe("conditions", () => {
  const answers = [{ fieldId: "a", value: "yes" }];
  it("runs without conditions", () => {
    expect(conditionsMatch("all", [], answers)).toBe(true);
  });
  it("supports all and any", () => {
    const yes = { fieldId: "a", operator: "equals" as const, value: "yes" };
    const no = { fieldId: "a", operator: "equals" as const, value: "no" };
    expect(conditionsMatch("all", [yes, no], answers)).toBe(false);
    expect(conditionsMatch("any", [yes, no], answers)).toBe(true);
  });
});

describe("automation definitions", () => {
  const valid: AutomationDefinition = {
    match: "all",
    conditions: [],
    steps: [{ id: "stp_1", delayMinutes: 0, recipient: { type: "respondent", fieldId: "fld_mail" }, subject: "Thanks", body: "Hi {{fld_name}}" }],
  };

  it("accepts a valid automation", () => {
    expect(parseDefinition(valid).ok).toBe(true);
    expect(activationProblems(valid, fields)).toEqual([]);
  });

  it("rejects bad addresses and excessive delays", () => {
    const badEmail = { ...valid, steps: [{ ...valid.steps[0], recipient: { type: "custom", addresses: ["nope"] } }] };
    expect(parseDefinition(badEmail).ok).toBe(false);
    expect(parseDefinition({ ...valid, steps: [{ ...valid.steps[0], delayMinutes: 9999999 }] }).ok).toBe(false);
  });

  it("blocks activation when content or fields are missing", () => {
    expect(activationProblems({ ...valid, steps: [] }, fields)).toContain("Add at least one email.");
    const missing = { ...valid, steps: [{ ...valid.steps[0], recipient: { type: "respondent" as const, fieldId: "fld_name" } }] };
    expect(activationProblems(missing, fields)[0]).toContain("email field");
    const badToken = { ...valid, steps: [{ ...valid.steps[0], body: "{{Removed field}}" }] };
    expect(activationProblems(badToken, fields)[0]).toContain("variable");
  });
});
