"use client";

import { useActionState, useState } from "react";
import type { ActionState } from "@/lib/admin/actionState";
import { PERMISSION_GROUPS, type Permission } from "@/lib/admin/permissions";
import { ConfirmSubmit, inputClass, labelClass, Notice, SubmitButton } from "../../../_components/forms";

type FormAction = (state: ActionState, form: FormData) => Promise<ActionState>;

interface RoleOption {
  id: string;
  name: string;
  isOwner: boolean;
  permissions: Permission[];
}

export function MemberEditor(props: {
  roles: RoleOption[];
  roleId: string;
  status: "active" | "disabled";
  granted: string[];
  revoked: string[];
  save: FormAction;
}) {
  const [state, action] = useActionState(props.save, {});
  const [roleId, setRoleId] = useState(props.roleId);
  const role = props.roles.find((r) => r.id === roleId);

  return (
    <form action={action} className="space-y-5 rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="font-semibold">Role and access</h2>
      <Notice state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="roleId" className={labelClass}>Role</label>
          <select id="roleId" name="roleId" value={roleId} onChange={(e) => setRoleId(e.target.value)} className={inputClass}>
            {props.roles.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="status" className={labelClass}>Status</label>
          <select id="status" name="status" defaultValue={props.status} className={inputClass}>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
      </div>

      {role?.isOwner ? (
        <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-900">Owners have access to everything.</p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Leave a feature on &quot;Role default&quot;, or allow or block it for this person.</p>
          {PERMISSION_GROUPS.map((group) => (
            <fieldset key={group.feature} className="rounded-lg border border-slate-200 p-3">
              <legend className="px-1 text-sm font-semibold">{group.feature}</legend>
              <div className="divide-y divide-slate-100">
                {group.permissions.map((p) => {
                  const inRole = role?.permissions.includes(p.key) ?? false;
                  const initial = props.revoked.includes(p.key) ? "deny" : props.granted.includes(p.key) ? "allow" : "default";
                  return (
                    <div key={p.key} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <label htmlFor={`perm-${p.key}`} className="text-sm">{p.label}</label>
                      <select id={`perm-${p.key}`} name={`perm:${p.key}`} defaultValue={initial} className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm">
                        <option value="default">Role default ({inRole ? "on" : "off"})</option>
                        <option value="allow">Allow</option>
                        <option value="deny">Block</option>
                      </select>
                    </div>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
      )}
      <SubmitButton>Save changes</SubmitButton>
    </form>
  );
}

function ActionForm({
  action: run,
  title,
  description,
  danger,
  label,
}: {
  action: FormAction;
  title: string;
  description: string;
  danger?: boolean;
  label: string;
}) {
  const [state, action] = useActionState(run, {});
  return (
    <form action={action} className="space-y-2 rounded-lg border border-slate-200 p-4">
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-sm text-slate-600">{description}</p>
      <Notice state={state} />
      {danger ? <ConfirmSubmit label={label} confirmLabel={`Confirm: ${label.toLowerCase()}`} /> : <SubmitButton variant="secondary" pendingLabel="Working…">{label}</SubmitButton>}
    </form>
  );
}

export function MemberSecurity({ resend, remove }: { resend?: FormAction; remove?: FormAction }) {
  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="font-semibold">Security</h2>
      {resend ? <ActionForm action={resend} title="Access link" description="Send a one-time link to set a new password." label="Resend access link" /> : null}
      {remove ? <ActionForm action={remove} title="Remove member" description="Deletes their login and removes dashboard access immediately." label="Remove member" danger /> : null}
    </section>
  );
}
