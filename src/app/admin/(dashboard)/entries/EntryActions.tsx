"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/admin/actionState";
import { ConfirmSubmit, inputClass, labelClass, Notice, SubmitButton } from "../../_components/forms";

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

export function ReviewActions({ approve, reject }: { approve: FormAction; reject: FormAction }) {
  const [approveState, approveAction] = useActionState(approve, {});
  const [rejectState, rejectAction] = useActionState(reject, {});
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="font-semibold">Review</h2>
      <form action={approveAction} className="space-y-2">
        <Notice state={approveState} />
        <p className="text-sm text-slate-600">Approving publishes the webpage and emails the client their link.</p>
        <SubmitButton pendingLabel="Publishing…">Approve and publish</SubmitButton>
      </form>
      <form action={rejectAction} className="space-y-2 border-t border-slate-100 pt-4">
        <Notice state={rejectState} />
        <div>
          <label htmlFor="reason" className={labelClass}>Reason for rejection</label>
          <textarea id="reason" name="reason" required minLength={3} maxLength={1000} rows={3} className={inputClass} />
          <p className="mt-1 text-xs text-slate-500">This is included in the email to the client.</p>
        </div>
        <ConfirmSubmit label="Reject entry" confirmLabel="Confirm: reject entry" />
      </form>
    </section>
  );
}

export function ResendEmail({ action: run }: { action: FormAction }) {
  const [state, action] = useActionState(run, {});
  return (
    <form action={action} className="space-y-2">
      <Notice state={state} />
      <SubmitButton variant="secondary" pendingLabel="Sending…">Resend client email</SubmitButton>
    </form>
  );
}
