import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/admin/auth";
import { formatDate } from "@/lib/admin/data";
import { hasPermission } from "@/lib/admin/permissions";
import { listEntries } from "@/lib/entries/store";
import { getTemplateMeta } from "@/templates/catalog";
import { StatusBadge } from "../../_components/StatusBadge";
import { restoreWebpageAction, suspendWebpageAction } from "../entries/actions";
import { ConfirmAction, DeleteEntryButton } from "../entries/EntryActions";

export const metadata: Metadata = { title: "Webpages" };

export default async function WebpagesPage() {
  const actor = await requirePermission("webpages.view");
  const pages = await listEntries(["approved", "suspended"]);
  const canManage = hasPermission(actor, "webpages.manage");
  const canOpenEntry = hasPermission(actor, "entries.view");
  const canDelete = hasPermission(actor, "entries.delete");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Webpages</h1>
        <p className="mt-1 text-sm text-slate-600">Approved client webpages. Suspended pages are offline but keep their address. Deleting a page frees its address for anyone to use.</p>
      </header>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Business</th>
              <th scope="col" className="px-4 py-3 font-semibold">Web address</th>
              <th scope="col" className="px-4 py-3 font-semibold">Template</th>
              <th scope="col" className="px-4 py-3 font-semibold">Published (UTC)</th>
              <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pages.map((p) => (
              <tr key={p.id} className="align-top">
                <td className="px-4 py-3">
                  <p className="font-medium">
                    {canOpenEntry ? <Link href={`/admin/entries/${p.id}`} className="hover:underline">{p.business_name}</Link> : p.business_name}
                  </p>
                  <p className="text-slate-500">{p.full_name}</p>
                </td>
                <td className="px-4 py-3 font-mono text-xs">
                  {p.status === "approved" ? (
                    <a href={`/${p.slug}`} target="_blank" rel="noopener noreferrer" className="text-teal-800 hover:underline">/{p.slug}</a>
                  ) : (
                    <span className="text-slate-500">/{p.slug}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">{getTemplateMeta(p.template_number)?.name ?? `Template ${p.template_number}`}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{p.published_at ? formatDate(p.published_at) : "—"}</td>
                <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                <td className="space-y-2 px-4 py-3">
                  {canManage && p.status === "approved" ? (
                    <ConfirmAction action={suspendWebpageAction.bind(null, p.id)} label="Suspend" confirmLabel="Take offline" />
                  ) : null}
                  {canManage && p.status === "suspended" ? (
                    <ConfirmAction action={restoreWebpageAction.bind(null, p.id)} label="Restore" confirmLabel="Put online" />
                  ) : null}
                  {canDelete ? <DeleteEntryButton id={p.id} slug={p.slug} /> : null}
                </td>
              </tr>
            ))}
            {pages.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">No webpages yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
