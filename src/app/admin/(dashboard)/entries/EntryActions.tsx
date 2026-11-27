"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import type { ActionState } from "@/lib/admin/actionState";
import { ConfirmSubmit, Notice } from "../../_components/forms";
import { deleteEntriesAction } from "./actions";

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

/** Two-step delete that frees the web address. Optionally navigates away once done. */
export function DeleteEntryButton({ id, slug, redirectTo }: { id: string; slug: string; redirectTo?: string }) {
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function confirm() {
    setError(null);
    start(async () => {
      try {
        const result = await deleteEntriesAction([id]);
        if (result.error) {
          setError(result.error);
          return;
        }
        setArmed(false);
        if (redirectTo) router.push(redirectTo);
        else router.refresh();
      } catch {
        setError("Couldn't delete this entry. Please try again.");
      }
    });
  }

  const base = "inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition";
  return (
    <div className="space-y-2">
      {error ? <Notice state={{ error }} /> : null}
      {armed ? (
        <div className="max-w-xs rounded-xl border border-red-200 bg-red-50 p-3 text-left">
          <p className="text-sm text-red-900">
            Delete permanently? <span className="font-mono break-all">/{slug}</span> goes offline and anyone can claim it.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={confirm} disabled={pending} className={`${base} bg-red-600 text-white hover:bg-red-700 disabled:opacity-60`}>
              {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Trash2 className="size-4" aria-hidden />}
              {pending ? "Deleting…" : "Delete"}
            </button>
            <button type="button" onClick={() => setArmed(false)} disabled={pending} className={`${base} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setArmed(true)} className={`${base} border border-red-200 bg-white text-red-700 hover:bg-red-50`}>
          <Trash2 className="size-4" aria-hidden /> Delete
        </button>
      )}
    </div>
  );
}
