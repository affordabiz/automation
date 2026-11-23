"use client";

import { useActionState } from "react";
import { inviteMemberAction } from "./actions";
import { inputClass, labelClass, Notice, SubmitButton } from "../../_components/forms";

export function InviteForm({ roles }: { roles: { id: string; name: string }[] }) {
  const [state, action] = useActionState(inviteMemberAction, {});
  return (
    <form action={action} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="font-semibold">Invite a team member</h2>
      <Notice state={state} />
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label htmlFor="invite-name" className={labelClass}>Full name</label>
          <input id="invite-name" name="fullName" required maxLength={100} autoComplete="off" className={inputClass} />
        </div>
        <div>
          <label htmlFor="invite-email" className={labelClass}>Email</label>
          <input id="invite-email" name="email" type="email" required autoComplete="off" className={inputClass} />
        </div>
        <div>
          <label htmlFor="invite-role" className={labelClass}>Role</label>
          <select id="invite-role" name="roleId" required defaultValue="" className={inputClass}>
            <option value="" disabled>Choose a role</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      </div>
      <SubmitButton pendingLabel="Inviting…">Send invitation</SubmitButton>
    </form>
  );
}
