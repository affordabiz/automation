import type { Metadata } from "next";
import { requirePermission } from "@/lib/admin/auth";
import { loadForm } from "../data";
import { ShareLinks } from "./ShareLinks";

export const metadata: Metadata = { title: "Share form" };

const escapeAttribute = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export default async function ShareFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePermission("forms.view");
  const form = await loadForm(id);
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
  const origin = new URL(base).origin;
  const frameId = `affordabiz-form-${form.slug}`;
  const embed = `<iframe id="${frameId}" src="${base}/embed/${form.slug}" title="${escapeAttribute(form.name)}" loading="lazy" style="width:100%;min-height:640px;border:0;"></iframe>
<script>
  window.addEventListener("message", function (event) {
    if (event.origin !== "${origin}") return;
    var data = event.data;
    if (!data || data.type !== "affordabiz-form-height" || data.slug !== "${form.slug}") return;
    var height = Number(data.height);
    if (height > 0) document.getElementById("${frameId}").style.height = height + "px";
  });
</script>`;
  return <ShareLinks link={`${base}/f/${form.slug}`} embed={embed} published={form.status === "published"} />;
}
