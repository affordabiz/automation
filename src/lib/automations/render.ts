import { escapeHtml } from "@/lib/emails/escape";
import { emailLayout, type EmailContent } from "@/lib/emails/layout";
import { ruleMatches } from "@/lib/forms/engine";
import type { FormField, FormValue, LogicRule, SubmissionAnswer } from "@/lib/forms/types";
import { BUILT_IN_TOKENS } from "./types";

const TOKEN = /\{\{\s*([^{}]+?)\s*\}\}/g;

export interface RenderContext {
  formName: string;
  submittedAt: string;
  answers: readonly Pick<SubmissionAnswer, "fieldId" | "label" | "display">[];
}

/** One pass only, so text a person typed into a form can never expand into another variable. */
export function renderText(template: string, context: RenderContext): string {
  const values = new Map(context.answers.map((a) => [a.fieldId, a.display]));
  return template.replace(TOKEN, (_, token: string) => {
    if (token === "form_name") return context.formName;
    if (token === "submitted_at") return context.submittedAt;
    if (token === "all_answers") return context.answers.map((a) => `${a.label}: ${a.display}`).join("\n");
    return values.get(token) ?? "";
  });
}

export function renderSubject(template: string, context: RenderContext): string {
  return renderText(template, context).replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim().slice(0, 200);
}

export function automationEmail(subject: string, body: string): EmailContent {
  const safeBody = escapeHtml(body).replace(/\r?\n/g, "<br>");
  return { subject, html: emailLayout(subject, `<p style="margin:0">${safeBody}</p>`), text: body };
}

export function conditionsMatch(
  match: "all" | "any",
  conditions: readonly LogicRule[],
  answers: readonly Pick<SubmissionAnswer, "fieldId" | "value">[],
): boolean {
  if (conditions.length === 0) return true;
  const values = new Map<string, FormValue>(answers.map((a) => [a.fieldId, a.value]));
  const check = (rule: LogicRule) => ruleMatches(rule, values.get(rule.fieldId));
  return match === "all" ? conditions.every(check) : conditions.some(check);
}

/** The editor shows {{Full name}}. Storage uses field IDs so renaming a field doesn't break emails. */
export function tokensToLabels(text: string, fields: readonly Pick<FormField, "id" | "label">[]): string {
  return text.replace(TOKEN, (match, token: string) => {
    const builtIn = BUILT_IN_TOKENS.find((t) => t.token === token);
    if (builtIn) return `{{${builtIn.label}}}`;
    const field = fields.find((f) => f.id === token);
    return field ? `{{${field.label}}}` : match;
  });
}

export function labelsToTokens(text: string, fields: readonly Pick<FormField, "id" | "label">[]): string {
  return text.replace(TOKEN, (match, label: string) => {
    const lower = label.toLowerCase();
    const builtIn = BUILT_IN_TOKENS.find((t) => t.label.toLowerCase() === lower);
    if (builtIn) return `{{${builtIn.token}}}`;
    const field = fields.find((f) => f.label.toLowerCase() === lower);
    return field ? `{{${field.id}}}` : match;
  });
}

export function unknownTokens(text: string, fields: readonly Pick<FormField, "id">[]): string[] {
  const known = new Set<string>([...BUILT_IN_TOKENS.map((t) => t.token), ...fields.map((f) => f.id)]);
  return [...text.matchAll(TOKEN)].map((m) => m[1]).filter((token) => !known.has(token));
}
