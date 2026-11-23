import { requirePermission } from "@/lib/admin/auth";
import { loadForm } from "./data";
import { FormTabs } from "./FormTabs";

export default async function FormLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePermission("forms.view");
  const form = await loadForm(id);
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <FormTabs id={form.id} name={form.name} published={form.status === "published"} />
      {children}
    </div>
  );
}
