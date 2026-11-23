import type { Metadata } from "next";
import { requirePermission } from "@/lib/admin/auth";
import { hasPermission } from "@/lib/admin/permissions";
import { TEMPLATE_CATALOG } from "@/templates/catalog";
import { loadForm } from "./data";
import { FormBuilder } from "./FormBuilder";

export const metadata: Metadata = { title: "Form builder" };

export default async function FormBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await requirePermission("forms.view");
  const form = await loadForm(id);
  return (
    <FormBuilder
      key={form.id}
      id={form.id}
      initialName={form.name}
      initialSlug={form.slug}
      initialSchema={form.draft_schema}
      status={form.status}
      hasUnpublishedChanges={form.status === "published" && JSON.stringify(form.draft_schema) !== JSON.stringify(form.published_schema)}
      canManage={hasPermission(actor, "forms.manage")}
      canPublish={hasPermission(actor, "forms.publish")}
      templates={TEMPLATE_CATALOG.filter((t) => t.status === "live").map((t) => t.number)}
    />
  );
}
