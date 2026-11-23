import type { Metadata } from "next";
import { requirePermission } from "@/lib/admin/auth";
import { formatDate } from "@/lib/admin/data";
import { hasPermission } from "@/lib/admin/permissions";
import { listSubmissions } from "@/lib/forms/store";
import { loadForm } from "../data";
import { SubmissionsTable } from "./SubmissionsTable";

export const metadata: Metadata = { title: "Form responses" };

export default async function SubmissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await requirePermission("forms.view");
  const form = await loadForm(id);
  const rows = await listSubmissions(form.id);
  return (
    <SubmissionsTable
      formId={form.id}
      rows={rows.map((r) => ({ ...r, dateLabel: formatDate(r.created_at) }))}
      canDelete={hasPermission(actor, "forms.manage")}
      canOpenEntry={hasPermission(actor, "entries.view")}
    />
  );
}
