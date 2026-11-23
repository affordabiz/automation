import type { Metadata } from "next";
import { requirePermission } from "@/lib/admin/auth";
import { formatDate } from "@/lib/admin/data";
import { hasPermission } from "@/lib/admin/permissions";
import { listForms } from "@/lib/forms/store";
import { FormsList } from "./FormsList";

export const metadata: Metadata = { title: "Forms" };

export default async function FormsPage() {
  const actor = await requirePermission("forms.view");
  const forms = await listForms();
  return (
    <FormsList
      forms={forms.map((f) => ({ ...f, updatedLabel: formatDate(f.updated_at).split(",").slice(0, 2).join(",") }))}
      canManage={hasPermission(actor, "forms.manage")}
    />
  );
}
