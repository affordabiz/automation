import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/admin/auth";
import { formatDate } from "@/lib/admin/data";
import { ENTRY_STATUS_LABELS, ENTRY_STATUSES, type EntryStatus } from "@/lib/entries/mapping";
import { countEntries, listEntries } from "@/lib/entries/store";
import { getTemplateMeta } from "@/templates/catalog";
import { StatusBadge } from "../../_components/StatusBadge";

export const metadata: Metadata = { title: "Entries" };

export default async function EntriesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: requested } = await searchParams;
  await requirePermission("entries.view");
  const status: EntryStatus = ENTRY_STATUSES.includes(requested as EntryStatus) ? (requested as EntryStatus) : "pending";
  const [entries, counts] = await Promise.all([listEntries([status]), Promise.all(ENTRY_STATUSES.map(countEntries))]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Entries</h1>
        <p className="mt-1 text-sm text-slate-600">Review form submissions before their webpages go live.</p>
      </header>

      <nav aria-label="Filter entries by status" className="flex gap-2 overflow-x-auto">
        {ENTRY_STATUSES.map((s, i) => (
          <Link
            key={s}
            href={`/admin/entries?status=${s}`}
            aria-current={s === status ? "page" : undefined}
            className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium ${s === status ? "bg-teal-800 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
          >
            {ENTRY_STATUS_LABELS[s]} ({counts[i]})
          </Link>
        ))}
      </nav>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Business</th>
              <th scope="col" className="px-4 py-3 font-semibold">Form</th>
              <th scope="col" className="px-4 py-3 font-semibold">Template</th>
              <th scope="col" className="px-4 py-3 font-semibold">Web address</th>
              <th scope="col" className="px-4 py-3 font-semibold">Submitted (UTC)</th>
              <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">{e.business_name}</p>
                  <p className="text-slate-500">{e.full_name} · {e.email}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">{e.forms.name}</td>
                <td className="px-4 py-3 text-slate-600">{getTemplateMeta(e.template_number)?.name ?? `Template ${e.template_number}`}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">/{e.slug}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(e.created_at)}</td>
                <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/entries/${e.id}`} className="font-medium text-teal-800 hover:underline">
                    {e.status === "pending" ? "Review" : "View"}
                  </Link>
                </td>
              </tr>
            ))}
            {entries.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No {ENTRY_STATUS_LABELS[status].toLowerCase()} entries.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
