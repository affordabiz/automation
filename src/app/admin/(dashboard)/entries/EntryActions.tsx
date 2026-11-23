"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/admin/actionState";
import { ConfirmSubmit, Notice } from "../../_components/forms";

type FormAction = (state: ActionState, form: FormData) => Promise<ActionState>;

export function ConfirmAction({ action: run, label, confirmLabel }: { action: FormAction; label: string; confirmLabel: string }) {
  const [state, action] = useActionState(run, {});
  return (
    <form action={action} className="space-y-2">
      <Notice state={state} />
      <ConfirmSubmit label={label} confirmLabel={confirmLabel} />
    </form>
  );
}
