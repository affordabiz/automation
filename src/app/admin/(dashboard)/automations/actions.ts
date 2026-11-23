"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionState } from "@/lib/admin/actionState";
import { recordAudit } from "@/lib/admin/audit";
import { requirePermission } from "@/lib/admin/auth";
import { activationProblems, parseDefinition } from "@/lib/automations/definition";
import { automationEmail, renderSubject, renderText } from "@/lib/automations/render";
import { getAutomation, type AutomationRecord } from "@/lib/automations/store";
import { sendEmail } from "@/lib/brevo";
import { isInputField } from "@/lib/forms/engine";
import { getForm } from "@/lib/forms/store";
import type { FormField, FormSchema } from "@/lib/forms/types";
import { rateLimit } from "@/lib/rateLimit";
import { serviceClient } from "@/lib/supabase/service";

const nameSchema = z.string().trim().min(2, "Use at least 2 characters.").max(100, "Name is too long.");

const refresh = () => revalidatePath("/admin", "layout");

async function load(id: string): Promise<AutomationRecord | null> {
  return z.uuid().safeParse(id).success ? getAutomation(id) : null;
}

async function formFields(formId: string): Promise<{ fields: FormField[]; published: boolean; name: string } | null> {
  const form = await getForm(formId);
  if (!form || form.is_system) return null;
  const schema: FormSchema = form.published_schema ?? form.draft_schema;
  return { fields: schema.fields, published: form.status === "published", name: form.name };
}

export async function createAutomationAction(_: ActionState, data: FormData): Promise<ActionState> {
  const actor = await requirePermission("automations.manage");
  const name = nameSchema.safeParse(data.get("name"));
  const formId = z.uuid().safeParse(data.get("formId"));
  if (!name.success) return { error: name.error.issues[0]?.message ?? "Enter a name." };
  if (!formId.success) return { error: "Choose a form." };
  if (!(await formFields(formId.data))) return { error: "That form isn't available." };

  const { data: row, error } = await serviceClient()
    .from("automations")
    .insert({ name: name.data, form_id: formId.data, created_by: actor.id })
    .select("id")
    .single<{ id: string }>();
  if (error) {
    console.error("[automations] create failed", error.message);
    return { error: "Couldn't create the automation." };
  }
  await recordAudit({ actor, action: "automations.created", targetType: "automation", targetId: row.id, details: { name: name.data } });
  refresh();
  redirect(`/admin/automations/${row.id}`);
}

export async function saveAutomationAction(id: string, input: { name: string; definition: unknown }): Promise<ActionState> {
  const actor = await requirePermission("automations.manage");
  const automation = await load(id);
  if (!automation) return { error: "Automation not found." };
  const name = nameSchema.safeParse(input.name);
  if (!name.success) return { error: `Name: ${name.error.issues[0]?.message}` };
  const parsed = parseDefinition(input.definition);
  if (!parsed.ok) return { error: parsed.error };

  if (automation.status === "active") {
    const form = await formFields(automation.form_id);
    const problems = form ? activationProblems(parsed.definition, form.fields) : ["The form is no longer available."];
    if (problems.length > 0) return { error: `Pause this automation to save incomplete changes. ${problems[0]}` };
  }
  const { error } = await serviceClient()
    .from("automations")
    .update({ name: name.data, ...parsed.definition })
    .eq("id", automation.id);
  if (error) {
    console.error("[automations] save failed", automation.id, error.message);
    return { error: "Couldn't save this automation." };
  }
  await recordAudit({ actor, action: "automations.saved", targetType: "automation", targetId: automation.id, details: { name: name.data } });
  refresh();
  return { message: "Saved." };
}

export async function setAutomationStatusAction(id: string, status: "active" | "paused"): Promise<ActionState> {
  const actor = await requirePermission("automations.manage");
  if (status !== "active" && status !== "paused") return { error: "Invalid status." };
  const automation = await load(id);
  if (!automation) return { error: "Automation not found." };

  if (status === "active") {
    const form = await formFields(automation.form_id);
    if (!form) return { error: "The form is no longer available." };
    if (!form.published) return { error: "Publish the form before turning this automation on." };
    const parsed = parseDefinition({ match: automation.match, conditions: automation.conditions, steps: automation.steps });
    if (!parsed.ok) return { error: parsed.error };
    const problems = activationProblems(parsed.definition, form.fields);
    if (problems.length > 0) return { error: problems.slice(0, 3).join(" ") };
  }
  const { error } = await serviceClient().from("automations").update({ status }).eq("id", automation.id);
  if (error) return { error: "Couldn't update this automation." };
  await recordAudit({ actor, action: status === "active" ? "automations.activated" : "automations.paused", targetType: "automation", targetId: automation.id, details: { name: automation.name } });
  refresh();
  return { message: status === "active" ? "Automation is on." : "Automation paused. Scheduled emails won't send." };
}

export async function deleteAutomationAction(id: string): Promise<ActionState> {
  const actor = await requirePermission("automations.manage");
  const automation = await load(id);
  if (!automation) return { error: "Automation not found." };
  const { error } = await serviceClient().from("automations").delete().eq("id", automation.id);
  if (error) return { error: "Couldn't delete this automation." };
  await recordAudit({ actor, action: "automations.deleted", targetType: "automation", targetId: automation.id, details: { name: automation.name } });
  refresh();
  return { message: "Automation deleted." };
}

export async function sendTestEmailAction(id: string, subject: string, body: string): Promise<ActionState> {
  const actor = await requirePermission("automations.manage");
  if (!rateLimit(`automation-test:${actor.id}`, 10, 60 * 60 * 1000)) return { error: "Too many test emails. Try again later." };
  const automation = await load(id);
  if (!automation) return { error: "Automation not found." };
  const text = z.object({ subject: z.string().trim().min(1, "Add a subject first.").max(200), body: z.string().trim().min(1, "Add a message first.").max(10000) }).safeParse({ subject, body });
  if (!text.success) return { error: text.error.issues[0]?.message ?? "Add a subject and message." };
  const form = await formFields(automation.form_id);
  if (!form) return { error: "The form is no longer available." };

  const context = {
    formName: form.name,
    submittedAt: "Sample date",
    answers: form.fields.filter(isInputField).map((f) => ({ fieldId: f.id, label: f.label, display: `[${f.label}]` })),
  };
  const result = await sendEmail({
    to: { email: actor.email, name: actor.fullName },
    ...automationEmail(`[Test] ${renderSubject(text.data.subject, context)}`.slice(0, 200), renderText(text.data.body, context)),
  });
  if (!result.ok) {
    console.error("[automations] test email failed", result.error);
    return { error: "The test email failed. Check your Brevo settings." };
  }
  if (result.messageId === "dry-run") return { message: "Email dry-run is on, so the test wasn't sent." };
  return { message: `Test email sent to ${actor.email}.` };
}
