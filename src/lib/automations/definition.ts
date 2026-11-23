import { z } from "zod";
import { isInputField } from "@/lib/forms/engine";
import { LOGIC_OPERATORS, type FormField } from "@/lib/forms/types";
import { unknownTokens } from "./render";
import { MAX_ADDRESSES, MAX_DELAY_MINUTES, MAX_STEPS, type AutomationDefinition } from "./types";

const email = z.string().trim().toLowerCase().pipe(z.email("Enter valid email addresses."));

const definitionSchema = z.object({
  match: z.enum(["all", "any"]),
  conditions: z
    .array(
      z.object({
        fieldId: z.string().max(60),
        operator: z.enum(LOGIC_OPERATORS.map((o) => o.value) as [(typeof LOGIC_OPERATORS)[number]["value"]]),
        value: z.string().max(500),
      }),
    )
    .max(10),
  steps: z
    .array(
      z.object({
        id: z.string().regex(/^stp_[a-zA-Z0-9]{1,40}$/),
        delayMinutes: z.number().int().min(0).max(MAX_DELAY_MINUTES, "Delays can be up to 365 days."),
        recipient: z.discriminatedUnion("type", [
          z.object({ type: z.literal("respondent"), fieldId: z.string().max(60) }),
          z.object({ type: z.literal("custom"), addresses: z.array(email).max(MAX_ADDRESSES, `Use up to ${MAX_ADDRESSES} addresses.`) }),
        ]),
        subject: z.string().max(200, "Subjects can be up to 200 characters."),
        body: z.string().max(10000, "Emails can be up to 10,000 characters."),
      }),
    )
    .max(MAX_STEPS, `Automations can have up to ${MAX_STEPS} emails.`),
});

export type ParsedDefinition = { ok: true; definition: AutomationDefinition } | { ok: false; error: string };

export function parseDefinition(raw: unknown): ParsedDefinition {
  const parsed = definitionSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "This automation isn't valid." };
  const ids = parsed.data.steps.map((s) => s.id);
  if (new Set(ids).size !== ids.length) return { ok: false, error: "Two emails have the same ID." };
  return { ok: true, definition: parsed.data };
}

/** Checks that must pass before an automation can send real emails. */
export function activationProblems(definition: AutomationDefinition, fields: readonly FormField[]): string[] {
  const problems: string[] = [];
  const inputs = fields.filter(isInputField);
  if (definition.steps.length === 0) problems.push("Add at least one email.");

  for (const rule of definition.conditions) {
    if (!inputs.some((f) => f.id === rule.fieldId)) problems.push("A condition uses a field that's no longer on the form.");
  }
  definition.steps.forEach((step, index) => {
    const label = `Email ${index + 1}`;
    if (!step.subject.trim()) problems.push(`${label} needs a subject.`);
    if (!step.body.trim()) problems.push(`${label} needs a message.`);
    if (step.recipient.type === "custom" && step.recipient.addresses.length === 0) problems.push(`${label} needs a recipient.`);
    if (step.recipient.type === "respondent") {
      const recipient = step.recipient;
      if (!fields.some((f) => f.id === recipient.fieldId && f.type === "email")) problems.push(`${label} needs an email field as its recipient.`);
    }
    if (unknownTokens(`${step.subject} ${step.body}`, fields).length > 0) problems.push(`${label} uses a variable that isn't on the form.`);
  });
  return [...new Set(problems)];
}
