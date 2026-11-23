"use client";

import { useActionState, useState } from "react";
import { forgotPasswordAction, loginAction } from "../actions";
import { inputClass, labelClass, Notice, SubmitButton } from "../../_components/forms";

export function LoginForm({ initialError }: { initialError?: string }) {
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [loginState, login] = useActionState(loginAction, initialError ? { error: initialError } : {});
  const [forgotState, forgot] = useActionState(forgotPasswordAction, {});

  if (mode === "forgot") {
    return (
      <form action={forgot} className="space-y-4">
        <h1 className="text-xl font-bold">Reset your password</h1>
        <Notice state={forgotState} />
        <div>
          <label htmlFor="reset-email" className={labelClass}>Email</label>
          <input id="reset-email" name="email" type="email" required autoComplete="email" className={inputClass} />
        </div>
        <SubmitButton className="w-full" pendingLabel="Sending…">Send reset link</SubmitButton>
        <button type="button" onClick={() => setMode("login")} className="w-full text-sm font-medium text-teal-800 hover:underline">
          Back to sign in
        </button>
      </form>
    );
  }

  return (
    <form action={login} className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Sign in</h1>
        <p className="mt-1 text-sm text-slate-600">Access is limited to invited team members.</p>
      </div>
      <Notice state={loginState} />
      <div>
        <label htmlFor="email" className={labelClass}>Email</label>
        <input id="email" name="email" type="email" required autoComplete="username" className={inputClass} />
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>Password</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className={inputClass} />
      </div>
      <SubmitButton className="w-full" pendingLabel="Signing in…">Sign in</SubmitButton>
      <button type="button" onClick={() => setMode("forgot")} className="w-full text-sm font-medium text-teal-800 hover:underline">
        Forgot password?
      </button>
    </form>
  );
}
