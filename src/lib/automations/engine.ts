import "server-only";
import { sendEmail } from "@/lib/brevo";
import type { SubmissionAnswer } from "@/lib/forms/types";
import { serviceClient } from "@/lib/supabase/service";
import { parseDefinition } from "./definition";
import { automationEmail, conditionsMatch, renderSubject, renderText } from "./render";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_ATTEMPTS = 3;
const RETRY_MINUTES = 5;
/** Stops a public form being used to flood someone else's inbox. */
const MAX_RESPONDENT_EMAILS_PER_HOUR = 5;

interface AutomationRow {
  id: string;
  match: string;
  conditions: unknown;
  steps: unknown;
}

interface JobRow {
  id: string;
  automation_id: string;
  to_email: string;
  reply_to: string | null;
  subject: string;
  body: string;
  attempts: number;
}

const dateLabel = (value: string) =>
  `${new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(value))} UTC`;

async function recentRespondentEmails(address: string): Promise<number> {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error } = await serviceClient()
    .from("automation_jobs")
    .select("id", { count: "exact", head: true })
    .eq("to_email", address)
    .neq("status", "skipped")
    .gte("created_at", since);
  if (error) throw new Error(`Could not check send limit: ${error.message}`);
  return count ?? 0;
}

/** Saves every email for a submission to the queue, so delayed sends survive restarts. */
export async function enqueueForSubmission(input: {
  formId: string;
  formName: string;
  submissionId: string;
  answers: readonly SubmissionAnswer[];
  submittedAt: string;
}): Promise<void> {
  const service = serviceClient();
  const { data, error } = await service
    .from("automations")
    .select("id,match,conditions,steps")
    .eq("form_id", input.formId)
    .eq("status", "active")
    .returns<AutomationRow[]>();
  if (error) throw new Error(`Could not load automations: ${error.message}`);

  const context = { formName: input.formName, submittedAt: dateLabel(input.submittedAt), answers: input.answers };
  const replyTo = input.answers.find((a) => a.type === "email" && typeof a.value === "string" && EMAIL.test(a.value))?.value as string | undefined;
  const start = new Date(input.submittedAt).getTime();
  const reserved = new Map<string, number>();
  const jobs: Record<string, unknown>[] = [];

  for (const automation of data) {
    const parsed = parseDefinition({ match: automation.match, conditions: automation.conditions, steps: automation.steps });
    if (!parsed.ok) {
      console.error("[automations] invalid definition", automation.id, parsed.error);
      continue;
    }
    const { match, conditions, steps } = parsed.definition;
    if (!conditionsMatch(match, conditions, input.answers)) continue;

    let delay = 0;
    for (const step of steps) {
      delay += step.delayMinutes;
      const recipient = step.recipient;
      const fromForm = recipient.type === "respondent";
      const addresses = fromForm
        ? [String(input.answers.find((a) => a.fieldId === recipient.fieldId)?.value ?? "").trim().toLowerCase()]
        : recipient.addresses;

      for (const address of addresses) {
        if (!EMAIL.test(address)) continue;
        let status = "pending";
        let jobError: string | null = null;
        if (fromForm) {
          const used = reserved.get(address) ?? (await recentRespondentEmails(address));
          if (used >= MAX_RESPONDENT_EMAILS_PER_HOUR) {
            status = "skipped";
            jobError = "Hourly limit reached for this recipient.";
          } else reserved.set(address, used + 1);
        }
        jobs.push({
          automation_id: automation.id,
          submission_id: input.submissionId,
          step_id: step.id,
          to_email: address,
          reply_to: !fromForm && replyTo ? replyTo : null,
          subject: renderSubject(step.subject, context) || input.formName,
          body: renderText(step.body, context).slice(0, 20000),
          status,
          error: jobError,
          scheduled_for: new Date(start + delay * 60 * 1000).toISOString(),
        });
      }
    }
  }

  if (jobs.length === 0) return;
  const { error: insertError } = await service
    .from("automation_jobs")
    .upsert(jobs, { onConflict: "automation_id,submission_id,step_id,to_email", ignoreDuplicates: true });
  if (insertError) throw new Error(`Could not queue emails: ${insertError.message}`);
}

async function finishJob(id: string, patch: Record<string, unknown>) {
  const { error } = await serviceClient().from("automation_jobs").update({ locked_at: null, ...patch }).eq("id", id);
  if (error) console.error("[automations] job update failed", id, error.message);
}

async function runJob(job: JobRow, active: ReadonlySet<string>) {
  if (!active.has(job.automation_id)) {
    return finishJob(job.id, { status: "skipped", error: "The automation was paused." });
  }
  if (job.attempts > MAX_ATTEMPTS) {
    return finishJob(job.id, { status: "failed", error: "Stopped after repeated failures." });
  }
  const result = await sendEmail({
    to: { email: job.to_email },
    ...(job.reply_to ? { replyTo: { email: job.reply_to } } : {}),
    ...automationEmail(job.subject, job.body),
  });
  if (result.ok) {
    const dryRun = result.messageId === "dry-run";
    return finishJob(job.id, {
      status: dryRun ? "not_sent" : "sent",
      error: dryRun ? "Email dry-run is on." : null,
      sent_at: new Date().toISOString(),
    });
  }
  console.error("[automations] send failed", job.id, result.error);
  if (job.attempts >= MAX_ATTEMPTS) return finishJob(job.id, { status: "failed", error: "The email provider rejected this email." });
  return finishJob(job.id, {
    status: "pending",
    error: "Retrying after a delivery error.",
    scheduled_for: new Date(Date.now() + job.attempts * RETRY_MINUTES * 60 * 1000).toISOString(),
  });
}

export async function processDueJobs(batch = 25): Promise<number> {
  const service = serviceClient();
  const { data: claimed, error } = await service.rpc("claim_automation_jobs", { batch });
  if (error) throw new Error(`Could not claim emails: ${error.message}`);
  const data = (claimed ?? []) as JobRow[];
  if (data.length === 0) return 0;

  const ids = [...new Set(data.map((job) => job.automation_id))];
  const { data: rows, error: statusError } = await service.from("automations").select("id").in("id", ids).eq("status", "active");
  if (statusError) throw new Error(`Could not check automations: ${statusError.message}`);
  const active = new Set((rows ?? []).map((row: { id: string }) => row.id));

  for (const job of data) await runJob(job, active);
  return data.length;
}
