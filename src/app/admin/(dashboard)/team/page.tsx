import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/admin/auth";
import { listMembers, listRoles } from "@/lib/admin/data";
import { canGrantAll, hasPermission } from "@/lib/admin/permissions";
import { InviteForm } from "./InviteForm";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage() {
  const actor = await requirePermission("team.view");
  const canInvite = hasPermission(actor, "team.invite");
  const [members, roles] = await Promise.all([listMembers(), canInvite ? listRoles() : []]);
  const assignable = roles
    .filter((r) => (actor.isOwner || !r.isOwner) && canGrantAll(actor, r.permissions))
    .map((r) => ({ id: r.id, name: r.name }));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Team</h1>
        <p className="mt-1 text-sm text-slate-600">Only people listed here can access the dashboard.</p>
      </header>

      {canInvite ? <InviteForm roles={assignable} /> : null}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Member</th>
              <th scope="col" className="px-4 py-3 font-semibold">Role</th>
              <th scope="col" className="px-4 py-3 font-semibold">Access</th>
              <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">{m.fullName}{m.id === actor.id ? " (you)" : ""}</p>
                  <p className="text-slate-500">{m.email}</p>
                </td>
                <td className="px-4 py-3">{m.roleName}</td>
                <td className="px-4 py-3 text-slate-600">
                  {m.isOwner ? "Everything" : `${m.permissions.length} permissions`}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${m.status === "active" ? "bg-teal-50 text-teal-800" : "bg-slate-100 text-slate-600"}`}>
                    {m.status === "active" ? "Active" : "Disabled"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/team/${m.id}`} className="font-medium text-teal-800 hover:underline">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
