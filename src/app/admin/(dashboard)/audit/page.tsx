import type { Metadata } from "next";
import { requirePermission } from "@/lib/admin/auth";
import { formatDate, listAudit } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Audit log" };

export default async function AuditPage() {
  await requirePermission("audit.view");
  const entries = await listAudit(200);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Audit log</h1>
        <p className="mt-1 text-sm text-slate-600">The latest 200 security and team events. Entries can&apos;t be edited or deleted.</p>
      </header>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">When (UTC)</th>
              <th scope="col" className="px-4 py-3 font-semibold">Who</th>
              <th scope="col" className="px-4 py-3 font-semibold">Action</th>
              <th scope="col" className="px-4 py-3 font-semibold">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.map((e) => (
              <tr key={e.id} className="align-top">
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(e.created_at)}</td>
                <td className="px-4 py-3">{e.actor_email ?? "System"}</td>
                <td className="px-4 py-3 font-medium">{e.action}</td>
                <td className="max-w-sm break-words px-4 py-3 font-mono text-xs text-slate-600">
                  {Object.keys(e.details).length > 0 ? JSON.stringify(e.details) : "—"}
                </td>
              </tr>
            ))}
            {entries.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-500">No activity yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
