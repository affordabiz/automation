"use client";

import { Copy, Eye, FileText, Inbox, Lock, Plus, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import type { ActionState } from "@/lib/admin/actionState";
import type { FormListItem, FormStatus } from "@/lib/forms/store";
import { inputClass, labelClass, Notice, SubmitButton } from "../../_components/forms";
import { createFormAction, deleteFormAction, duplicateFormAction } from "./actions";

const STATUS: Record<FormStatus, { label: string; style: string }> = {
  published: { label: "Published", style: "bg-emerald-50 text-emerald-700 ring-emerald-600/15" },
  draft: { label: "Draft", style: "bg-slate-100 text-slate-700 ring-slate-500/15" },
  archived: { label: "Archived", style: "bg-amber-50 text-amber-800 ring-amber-600/20" },
};

function CreateDialog({ onClose }: { onClose: () => void }) {
  const [state, action] = useActionState(createFormAction, {});
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/40 p-4" onClick={onClose}>
      <form
        action={action}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-form-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <h2 id="new-form-title" className="text-lg font-semibold">New form</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100">
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <Notice state={state} />
        <div>
          <label htmlFor="form-name" className={labelClass}>Form name</label>
          <input id="form-name" name="name" required minLength={2} maxLength={100} autoFocus placeholder="e.g. Client intake" className={inputClass} />
        </div>
        <SubmitButton className="w-full" pendingLabel="Creating…">Create form</SubmitButton>
      </form>
    </div>
  );
}

type Row = FormListItem;

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const plural = (n: number, one: string, many: string) => `${compact.format(n)} ${n === 1 ? one : many}`;

export function FormsList({ forms, canManage }: { forms: Row[]; canManage: boolean }) {
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Row | null>(null);
  const [notice, setNotice] = useState<ActionState>({});
  const [pending, start] = useTransition();

  const run = (action: () => Promise<ActionState>) => {
    setNotice({});
    start(async () => {
      try {
        setNotice(await action());
      } catch {
        setNotice({ error: "Something went wrong. Please try again." });
      }
    });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Forms</h1>
          <p className="mt-0.5 text-sm text-slate-500">Build forms, share them anywhere and collect responses.</p>
        </div>
        {canManage ? (
          <button type="button" onClick={() => setCreating(true)} className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800">
            <Plus className="size-4" aria-hidden /> New form
          </button>
        ) : null}
      </header>

      <Notice state={notice} />

      {forms.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <FileText className="mx-auto size-8 text-slate-400" aria-hidden />
          <p className="mt-3 font-medium text-slate-700">No forms yet</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => {
            const status = STATUS[form.status];
            return (
              <li key={form.id} className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-teal-600/60 hover:shadow-md focus-within:border-teal-600/60">
                <div className="flex items-start justify-between gap-2">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700">
                    {form.is_system ? <Lock className="size-5" aria-hidden /> : <FileText className="size-5" aria-hidden />}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${form.is_system ? "bg-sky-50 text-sky-700 ring-sky-600/15" : status.style}`}>
                    {form.is_system ? "Built-in" : status.label}
                  </span>
                </div>
                <h2 className="mt-3 truncate font-semibold text-slate-900">
                  {/* The link covers the whole card; action buttons sit above it. */}
                  <Link
                    href={form.is_system ? "/admin/entries" : `/admin/forms/${form.id}/submissions`}
                    className="outline-none after:absolute after:inset-0 after:rounded-2xl after:content-[''] group-hover:text-teal-800 focus-visible:after:ring-2 focus-visible:after:ring-teal-700"
                  >
                    {form.name}
                  </Link>
                </h2>
                <dl className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <dt className="sr-only">{form.is_system ? "Entries" : "Responses"}</dt>
                    <Inbox className="size-3.5 text-slate-400" aria-hidden />
                    <dd className="font-medium text-slate-700">
                      {form.is_system ? plural(form.submissions, "entry", "entries") : plural(form.submissions, "response", "responses")}
                    </dd>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <dt className="sr-only">Views</dt>
                    <Eye className="size-3.5 text-slate-400" aria-hidden />
                    <dd className="font-medium text-slate-700">{plural(form.views, "view", "views")}</dd>
                  </div>
                </dl>
                <div className="relative z-10 mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                  {form.is_system ? (
                    <Link href="/admin/entries" className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                      <Inbox className="size-4" aria-hidden /> View entries
                    </Link>
                  ) : (
                    <>
                      <Link href={`/admin/forms/${form.id}`} className="flex-1 rounded-lg bg-teal-700 px-3 py-2 text-center text-sm font-semibold text-white transition hover:bg-teal-800">
                        {canManage ? "Edit" : "Open"}
                      </Link>
                      <Link href={`/admin/forms/${form.id}/submissions`} aria-label={`Responses for ${form.name}`} title="Responses" className="grid size-9 place-items-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50">
                        <Inbox className="size-4" aria-hidden />
                      </Link>
                      {canManage ? (
                        <>
                          <button type="button" disabled={pending} onClick={() => run(() => duplicateFormAction(form.id))} aria-label={`Duplicate ${form.name}`} title="Duplicate" className="grid size-9 place-items-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                            <Copy className="size-4" aria-hidden />
                          </button>
                          <button type="button" disabled={pending} onClick={() => setConfirmDelete(form)} aria-label={`Delete ${form.name}`} title="Delete" className="grid size-9 place-items-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50">
                            <Trash2 className="size-4" aria-hidden />
                          </button>
                        </>
                      ) : null}
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {creating ? <CreateDialog onClose={() => setCreating(false)} /> : null}

      {confirmDelete ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/40 p-4" onClick={() => setConfirmDelete(null)}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="delete-form-title" onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 id="delete-form-title" className="text-lg font-semibold">Delete this form?</h2>
            <p className="mt-1 text-sm text-slate-600">
              &quot;{confirmDelete.name}&quot; and its {confirmDelete.submissions} {confirmDelete.submissions === 1 ? "response" : "responses"} will be permanently deleted. Its public link and embeds will stop working.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" autoFocus onClick={() => setConfirmDelete(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button
                type="button"
                onClick={() => {
                  const id = confirmDelete.id;
                  setConfirmDelete(null);
                  run(() => deleteFormAction(id));
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
