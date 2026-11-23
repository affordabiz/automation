"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/admin/actionState";
import { PERMISSION_GROUPS, type Permission } from "@/lib/admin/permissions";
import { ConfirmSubmit, inputClass, labelClass, Notice, SubmitButton } from "../../_components/forms";

type FormAction = (state: ActionState, form: FormData) => Promise<ActionState>;

export function RoleEditor({
  idPrefix,
  name = "",
  description = "",
  permissions = [],
  grantable,
  save,
  remove,
  submitLabel,
}: {
  idPrefix: string;
  name?: string;
  description?: string;
  permissions?: Permission[];
  grantable: Permission[];
  save: FormAction;
  remove?: FormAction;
  submitLabel: string;
}) {
  const [state, action] = useActionState(save, {});
  const [removeState, removeAction] = useActionState(remove ?? (async () => ({})), {});

  return (
    <div className="space-y-3">
      <form action={action} className="space-y-4">
        <Notice state={state} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${idPrefix}-name`} className={labelClass}>Role name</label>
            <input id={`${idPrefix}-name`} name="name" required minLength={2} maxLength={50} defaultValue={name} className={inputClass} />
          </div>
          <div>
            <label htmlFor={`${idPrefix}-description`} className={labelClass}>Description</label>
            <input id={`${idPrefix}-description`} name="description" maxLength={200} defaultValue={description} className={inputClass} />
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {PERMISSION_GROUPS.map((group) => (
            <fieldset key={group.feature} className="rounded-lg border border-slate-200 p-3">
              <legend className="px-1 text-sm font-semibold">{group.feature}</legend>
              <div className="space-y-1.5">
                {group.permissions.map((p) => (
                  <label key={p.key} className={`flex items-center gap-2 text-sm ${grantable.includes(p.key) ? "" : "text-slate-400"}`}>
                    <input
                      type="checkbox"
                      name="permissions"
                      value={p.key}
                      defaultChecked={permissions.includes(p.key)}
                      disabled={!grantable.includes(p.key)}
                      className="size-4 accent-teal-800"
                    />
                    {p.label}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
        <SubmitButton>{submitLabel}</SubmitButton>
      </form>
      {remove ? (
        <form action={removeAction} className="space-y-2">
          <Notice state={removeState} />
          <ConfirmSubmit label="Delete role" confirmLabel="Confirm: delete role" />
        </form>
      ) : null}
    </div>
  );
}
