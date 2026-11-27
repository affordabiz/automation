"use client";

import { useActionState, useState } from "react";
import { ArrowLeft, MailCheck } from "lucide-react";
import { forgotPasswordAction, loginAction } from "../actions";
import { inputClass, labelClass, Notice, SubmitButton } from "../../_components/forms";

export function LoginForm({ initialError }: { initialError?: string }) {
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [loginState, login] = useActionState(loginAction, initialError ? { error: initialError } : {});
  const [forgotState, forgot] = useActionState(forgotPasswordAction, {});
  const [resetEmail, setResetEmail] = useState("");
  const [editing, setEditing] = useState(true);
  const sent = !editing && Boolean(forgotState.message) && !forgotState.error;

  const backToLogin = () => {
    setMode("login");
    setEditing(true);
  };

  if (mode === "forgot" && sent) {
    return (
      <div className="space-y-5 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-teal-50 text-teal-800 ring-8 ring-teal-50/50">
          <MailCheck className="size-7" aria-hidden />
        </span>
        <div role="status">
          <h1 className="text-xl font-bold">Check your email</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{forgotState.message}</p>
          <p className="mt-3 inline-block max-w-full rounded-lg bg-slate-50 px-3 py-1.5 text-sm font-semibold break-all text-slate-900 ring-1 ring-slate-200">
            {resetEmail}
          </p>
        </div>
        <p className="text-xs leading-relaxed text-slate-500">
          The link opens a page where you choose a new password. Can&apos;t see it? Check your spam folder.
        </p>
        {forgotState.previewLink ? <Notice state={{ previewLink: forgotState.previewLink, message: "Email dry-run is on." }} /> : null}
        <form action={forgot} className="space-y-2">
          <input type="hidden" name="email" value={resetEmail} />
          <SubmitButton variant="secondary" className="w-full" pendingLabel="Sending…">
            Resend link
          </SubmitButton>
        </form>
        <div className="flex flex-col gap-2 text-sm font-medium sm:flex-row sm:justify-between">
          <button type="button" onClick={() => setEditing(true)} className="text-teal-800 hover:underline">
            Use a different email
          </button>
          <button type="button" onClick={backToLogin} className="inline-flex items-center justify-center gap-1 text-teal-800 hover:underline">
            <ArrowLeft className="size-4" aria-hidden />
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  if (mode === "forgot") {
    return (
      <form action={forgot} onSubmit={() => setEditing(false)} className="space-y-4">
        <div>
          <h1 className="text-xl font-bold">Reset your password</h1>
          <p className="mt-1 text-sm text-slate-600">Enter your team email and we&apos;ll send you a link to choose a new password.</p>
        </div>
        {forgotState.error ? <Notice state={forgotState} /> : null}
        <div>
          <label htmlFor="reset-email" className={labelClass}>Email</label>
          <input
            id="reset-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            className={inputClass}
          />
        </div>
        <SubmitButton className="w-full" pendingLabel="Sending…">Send reset link</SubmitButton>
        <button type="button" onClick={backToLogin} className="w-full text-sm font-medium text-teal-800 hover:underline">
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
