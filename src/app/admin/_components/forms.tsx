"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/admin/actionState";

export const inputClass =
  "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20";
export const labelClass = "block text-sm font-medium text-slate-700";

const VARIANTS = {
  primary: "bg-teal-800 text-white hover:bg-teal-900",
  secondary: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
  danger: "bg-red-600 text-white hover:bg-red-700",
} as const;

export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  variant = "primary",
  className = "",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: keyof typeof VARIANTS;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${className}`}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

/** Asks for a second click before a destructive action submits. */
export function ConfirmSubmit({ label, confirmLabel }: { label: string; confirmLabel: string }) {
  const [armed, setArmed] = useState(false);
  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
      >
        {label}
      </button>
    );
  }
  return (
    <span className="inline-flex flex-wrap gap-2">
      <SubmitButton variant="danger" pendingLabel="Working…">
        {confirmLabel}
      </SubmitButton>
      <button
        type="button"
        onClick={() => setArmed(false)}
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        Cancel
      </button>
    </span>
  );
}

export function Notice({ state }: { state: ActionState }) {
  if (!state.error && !state.message) return null;
  return (
    <div
      role={state.error ? "alert" : "status"}
      className={`rounded-lg px-3 py-2 text-sm ${state.error ? "bg-red-50 text-red-800" : "bg-teal-50 text-teal-900"}`}
    >
      <p>{state.error ?? state.message}</p>
      {state.previewLink ? (
        <p className="mt-2 break-all">
          <span className="font-semibold">Local one-time link: </span>
          <a className="underline" href={state.previewLink}>
            {state.previewLink}
          </a>
        </p>
      ) : null}
    </div>
  );
}
