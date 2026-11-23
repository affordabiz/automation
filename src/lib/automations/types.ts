import type { LogicRule } from "@/lib/forms/types";

export type AutomationStatus = "draft" | "active" | "paused";
export type JobStatus = "pending" | "processing" | "sent" | "not_sent" | "failed" | "skipped";

export type StepRecipient =
  | { type: "respondent"; fieldId: string }
  | { type: "custom"; addresses: string[] };

export interface AutomationStep {
  id: string;
  delayMinutes: number;
  recipient: StepRecipient;
  subject: string;
  body: string;
}

export interface AutomationDefinition {
  match: "all" | "any";
  conditions: LogicRule[];
  steps: AutomationStep[];
}

export const MAX_STEPS = 10;
export const MAX_DELAY_MINUTES = 365 * 24 * 60;
export const MAX_ADDRESSES = 10;

export const BUILT_IN_TOKENS = [
  { token: "form_name", label: "Form name" },
  { token: "submitted_at", label: "Submitted at" },
  { token: "all_answers", label: "All answers" },
] as const;

export const newStep = (): AutomationStep => ({
  id: `stp_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`,
  delayMinutes: 0,
  recipient: { type: "custom", addresses: [] },
  subject: "",
  body: "",
});
