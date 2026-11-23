import type { Metadata } from "next";
import { requirePermission } from "@/lib/admin/auth";
import { hasPermission } from "@/lib/admin/permissions";
import { listAutomations } from "@/lib/automations/store";
import { listForms } from "@/lib/forms/store";
import { AutomationsList } from "./AutomationsList";

export const metadata: Metadata = { title: "Automations" };

export default async function AutomationsPage() {
  const actor = await requirePermission("automations.view");
  const [automations, forms] = await Promise.all([listAutomations(), listForms()]);
  return (
    <AutomationsList
      automations={automations.map((a) => ({
        id: a.id,
        name: a.name,
        status: a.status,
        formName: a.forms.name,
        emails: a.steps.length,
        sent: a.sent,
        scheduled: a.scheduled,
        failed: a.failed,
      }))}
      forms={forms.filter((f) => !f.is_system).map((f) => ({ id: f.id, name: f.name, published: f.status === "published" }))}
      canManage={hasPermission(actor, "automations.manage")}
    />
  );
}
