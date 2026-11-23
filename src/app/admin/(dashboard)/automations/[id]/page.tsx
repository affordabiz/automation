import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requirePermission } from "@/lib/admin/auth";
import { formatDate } from "@/lib/admin/data";
import { hasPermission } from "@/lib/admin/permissions";
import { tokensToLabels } from "@/lib/automations/render";
import { getAutomation, listJobActivity } from "@/lib/automations/store";
import { isInputField } from "@/lib/forms/engine";
import { getForm } from "@/lib/forms/store";
import { AutomationEditor } from "./AutomationEditor";

export const metadata: Metadata = { title: "Automation" };

export default async function AutomationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await requirePermission("automations.view");
  if (!z.uuid().safeParse(id).success) notFound();
  const automation = await getAutomation(id);
  if (!automation) notFound();
  const [form, activity] = await Promise.all([getForm(automation.form_id), listJobActivity(automation.id)]);
  if (!form) notFound();

  const schema = form.published_schema ?? form.draft_schema;
  const fields = schema.fields.filter(isInputField).map((f) => ({
    id: f.id,
    type: f.type,
    label: f.label,
    options: f.options,
  }));

  return (
    <AutomationEditor
      key={automation.id}
      id={automation.id}
      initialName={automation.name}
      status={automation.status}
      formId={form.id}
      formName={form.name}
      formPublished={form.status === "published"}
      fields={fields}
      initialDefinition={{
        match: automation.match,
        conditions: automation.conditions,
        steps: automation.steps.map((s) => ({
          ...s,
          subject: tokensToLabels(s.subject, fields),
          body: tokensToLabels(s.body, fields),
        })),
      }}
      activity={activity.map((a) => ({
        id: a.id,
        toEmail: a.to_email,
        subject: a.subject,
        status: a.status,
        error: a.error,
        dateLabel: formatDate(a.sent_at ?? a.scheduled_for),
      }))}
      canManage={hasPermission(actor, "automations.manage")}
    />
  );
}
