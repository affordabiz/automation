import { notFound } from "next/navigation";
import { z } from "zod";
import { recordAudit } from "@/lib/admin/audit";
import { requirePermission } from "@/lib/admin/auth";
import { csvCell } from "@/lib/forms/engine";
import { getForm, listSubmissions } from "@/lib/forms/store";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const actor = await requirePermission("forms.view");
  if (!z.uuid().safeParse(id).success) notFound();
  const form = await getForm(id);
  if (!form || form.is_system) notFound();

  const rows = await listSubmissions(form.id, 10000);
  const columns = new Map<string, string>();
  for (const row of [...rows].reverse()) {
    for (const answer of row.answers) columns.set(answer.fieldId, answer.label);
  }
  const ids = [...columns.keys()];
  const header = ["Submitted (UTC)", "Source", ...columns.values()].map(csvCell).join(",");
  const lines = rows.map((row) => {
    const answers = new Map(row.answers.map((a) => [a.fieldId, a.display]));
    return [row.created_at, row.source, ...ids.map((fieldId) => answers.get(fieldId) ?? "")].map(csvCell).join(",");
  });

  await recordAudit({ actor, action: "forms.submissions_exported", targetType: "form", targetId: form.id, details: { count: rows.length } });
  return new Response(`﻿${[header, ...lines].join("\r\n")}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${form.slug}-responses.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
