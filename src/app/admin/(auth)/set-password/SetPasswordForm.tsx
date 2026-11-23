"use client";

import { useActionState } from "react";
import { setPasswordAction } from "../actions";
import { inputClass, labelClass, Notice, SubmitButton } from "../../_components/forms";

export function SetPasswordForm({ tokenHash, type }: { tokenHash: string; type: "invite" | "recovery" }) {
  const [state, action] = useActionState(setPasswordAction, {});
  return (
    <form action={action} className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">{type === "invite" ? "Accept your invitation" : "Choose a new password"}</h1>
        <p className="mt-1 text-sm text-slate-600">Use at least 12 characters.</p>
      </div>
      <Notice state={state} />
      <input type="hidden" name="token_hash" value={tokenHash} />
      <input type="hidden" name="type" value={type} />
      <div>
        <label htmlFor="password" className={labelClass}>New password</label>
        <input id="password" name="password" type="password" required minLength={12} maxLength={72} autoComplete="new-password" className={inputClass} />
      </div>
      <div>
        <label htmlFor="confirm" className={labelClass}>Confirm password</label>
        <input id="confirm" name="confirm" type="password" required minLength={12} maxLength={72} autoComplete="new-password" className={inputClass} />
      </div>
      <SubmitButton className="w-full" pendingLabel="Saving…">Set password</SubmitButton>
    </form>
  );
}
