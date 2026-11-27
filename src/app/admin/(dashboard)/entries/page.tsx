import type { Metadata } from "next";
import { requirePermission } from "@/lib/admin/auth";
import { formatDate } from "@/lib/admin/data";
import { hasPermission } from "@/lib/admin/permissions";
import { ENTRY_TABS, type EntryStatus } from "@/lib/entries/mapping";
import { getAutoPublish, listEntryRows } from "@/lib/entries/store";
import { EntriesWorkspace } from "./EntriesWorkspace";

export const metadata: Metadata = { title: "Entries" };

export default async function EntriesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: requested } = await searchParams;
  const actor = await requirePermission("entries.view");
  const canSetAuto = hasPermission(actor, "settings.manage");
  const [rows, autoPublish] = await Promise.all([listEntryRows(), canSetAuto ? getAutoPublish() : false]);
  const initialStatus: EntryStatus = ENTRY_TABS.includes(requested as EntryStatus) ? (requested as EntryStatus) : "pending";

  return (
    <EntriesWorkspace
      rows={rows.map((r) => ({ ...r, dateLabel: formatDate(r.created_at) }))}
      initialStatus={initialStatus}
      autoPublish={autoPublish}
      canSetAuto={canSetAuto}
      canReview={hasPermission(actor, "entries.review")}
      canDelete={hasPermission(actor, "entries.delete")}
    />
  );
}
