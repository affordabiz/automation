import type { Metadata } from "next";
import { requirePermission } from "@/lib/admin/auth";
import { listMembers, listRoles } from "@/lib/admin/data";
import { ALL_PERMISSIONS, canGrantAll } from "@/lib/admin/permissions";
import { deleteRoleAction, saveRoleAction } from "./actions";
import { RoleEditor } from "./RoleEditor";

export const metadata: Metadata = { title: "Roles" };

export default async function RolesPage() {
  const actor = await requirePermission("roles.manage");
  const [roles, members] = await Promise.all([listRoles(), listMembers()]);
  const grantable = ALL_PERMISSIONS.filter((p) => canGrantAll(actor, [p]));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Roles</h1>
        <p className="mt-1 text-sm text-slate-600">A role is a reusable set of feature permissions.</p>
      </header>

      <details className="rounded-xl border border-slate-200 bg-white p-5">
        <summary className="cursor-pointer font-semibold">Create a role</summary>
        <div className="mt-4">
          <RoleEditor idPrefix="new" grantable={grantable} save={saveRoleAction.bind(null, null)} submitLabel="Create role" />
        </div>
      </details>

      <ul className="space-y-3">
        {roles.map((role) => {
          const count = members.filter((m) => m.roleId === role.id).length;
          const editable = !role.isOwner && canGrantAll(actor, role.permissions);
          return (
            <li key={role.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <details>
                <summary className="cursor-pointer">
                  <span className="font-semibold">{role.name}</span>
                  <span className="ml-2 text-sm text-slate-500">
                    {count} {count === 1 ? "member" : "members"} · {role.isOwner ? "All permissions" : `${role.permissions.length} permissions`}
                  </span>
                  {role.description ? <span className="mt-1 block text-sm text-slate-600">{role.description}</span> : null}
                </summary>
                <div className="mt-4">
                  {editable ? (
                    <RoleEditor
                      key={role.permissions.join(",")}
                      idPrefix={role.id}
                      name={role.name}
                      description={role.description}
                      permissions={role.permissions}
                      grantable={grantable}
                      save={saveRoleAction.bind(null, role.id)}
                      remove={deleteRoleAction.bind(null, role.id)}
                      submitLabel="Save role"
                    />
                  ) : (
                    <p className="text-sm text-slate-600">
                      {role.isOwner ? "The Owner role is protected and always has every permission." : "This role has access you don't hold, so you can't edit it."}
                    </p>
                  )}
                </div>
              </details>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
