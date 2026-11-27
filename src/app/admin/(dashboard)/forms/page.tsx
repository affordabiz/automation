import type { Metadata } from "next";
import { requirePermission } from "@/lib/admin/auth";
import { hasPermission } from "@/lib/admin/permissions";
import { listForms } from "@/lib/forms/store";
import { FormsList } from "./FormsList";

export const metadata: Metadata = { title: "Forms" };

export default async function FormsPage() {
  const actor = await requirePermission("forms.view");
  const forms = await listForms();
  return (
    <FormsList
      forms={forms}
      canManage={hasPermission(actor, "forms.manage")}
    />
  );
}
