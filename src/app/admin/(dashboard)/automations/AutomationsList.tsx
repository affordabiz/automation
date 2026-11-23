"use client";

import { FileText, Mail, Plus, Trash2, Workflow, X, Zap } from "lucide-react";
import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import type { ActionState } from "@/lib/admin/actionState";
import type { AutomationStatus } from "@/lib/automations/types";
import { inputClass, labelClass, Notice, SubmitButton } from "../../_components/forms";
import { createAutomationAction, deleteAutomationAction, setAutomationStatusAction } from "./actions";

interface Row {
  id: string;
  name: string;
  status: AutomationStatus;
  formName: string;
  emails: number;
  sent: number;
  scheduled: number;
  failed: number;
}

export const STATUS_STYLES: Record<AutomationStatus, { label: string; style: string }> = {
  active: { label: "On", style: "bg-emerald-50 text-emerald-700 ring-emerald-600/15" },
  paused: { label: "Paused", style: "bg-amber-50 text-amber-800 ring-amber-600/20" },
  draft: { label: "Draft", style: "bg-slate-100 text-slate-700 ring-slate-500/15" },
};

function CreateDialog({ forms, onClose }: { forms: { id: string; name: string; published: boolean }[]; onClose: () => void }) {
  const [state, action] = useActionState(createAutomationAction, {});
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/40 p-4" onClick={onClose}>
      <form action={action} role="dialog" aria-modal="true" aria-labelledby="new-automation-title" onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 id="new-automation-title" className="text-lg font-semibold">New automation</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"><X className="size-5" aria-hidden /></button>
        </div>
        <Notice state={state} />
        <div>
          <label htmlFor="automation-name" className={labelClass}>Name</label>
          <input id="automation-name" name="name" required minLength={2} maxLength={100} autoFocus placeholder="e.g. Welcome email" className={inputClass} />
        </div>
        <div>
          <label htmlFor="automation-form" className={labelClass}>When this form is submitted</label>
          <select id="automation-form" name="formId" required defaultValue="" className={inputClass}>
            <option value="" disabled>Choose a form</option>
            {forms.map((f) => <option key={f.id} value={f.id}>{f.name}{f.published ? "" : " (draft)"}</option>)}
          </select>
        </div>
        <SubmitButton className="w-full" pendingLabel="Creating…">Create automation</SubmitButton>
      </form>
    </div>
  );
}

export function AutomationsList({ automations, forms, canManage }: { automations: Row[]; forms: { id: string; name: string; published: boolean }[]; canManage: boolean }) {
  const [creating, setCreating] = useState(false);
  const [confirm, setConfirm] = useState<Row | null>(null);
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
          <h1 className="text-2xl font-semibold tracking-tight">Automations</h1>
          <p className="mt-0.5 text-sm text-slate-500">Send emails automatically when a form is submitted.</p>
        </div>
        {canManage ? (
          <button type="button" disabled={forms.length === 0} onClick={() => setCreating(true)} className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-50">
            <Plus className="size-4" aria-hidden /> New automation
          </button>
        ) : null}
      </header>

      <Notice state={notice} />

      {automations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <Workflow className="mx-auto size-8 text-slate-400" aria-hidden />
          <p className="mt-3 font-medium text-slate-700">No automations yet</p>
          <p className="mt-1 text-sm text-slate-500">{forms.length === 0 ? "Create a form first, then automate its emails." : "Create one to email clients or your team after a submission."}</p>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {automations.map((a) => {
            const status = STATUS_STYLES[a.status];
            return (
              <li key={a.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-teal-600/60 hover:shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-700"><Zap className="size-5" aria-hidden /></span>
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold"><Link href={`/admin/automations/${a.id}`} className="hover:underline">{a.name}</Link></h2>
                      <p className="flex items-center gap-1 truncate text-xs text-slate-500"><FileText className="size-3 shrink-0" aria-hidden /> {a.formName}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${status.style}`}>{status.label}</span>
                </div>
                <dl className="mt-4 grid grid-cols-4 gap-2 rounded-xl bg-slate-50 p-3 text-center">
                  {[
                    { label: "Emails", value: a.emails },
                    { label: "Sent", value: a.sent },
                    { label: "Queued", value: a.scheduled },
                    { label: "Failed", value: a.failed },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <dd className={`font-semibold tabular-nums ${stat.label === "Failed" && stat.value > 0 ? "text-red-700" : "text-slate-900"}`}>{stat.value}</dd>
                      <dt className="text-[11px] text-slate-500">{stat.label}</dt>
                    </div>
                  ))}
                </dl>
                <div className="mt-4 flex items-center gap-2">
                  <Link href={`/admin/automations/${a.id}`} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-800">
                    <Mail className="size-4" aria-hidden /> {canManage ? "Edit" : "View"}
                  </Link>
                  {canManage ? (
                    <>
                      <button type="button" disabled={pending} onClick={() => run(() => setAutomationStatusAction(a.id, a.status === "active" ? "paused" : "active"))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">
                        {a.status === "active" ? "Pause" : "Turn on"}
                      </button>
                      <button type="button" aria-label={`Delete ${a.name}`} disabled={pending} onClick={() => setConfirm(a)} className="grid size-9 place-items-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 disabled:opacity-50">
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {creating ? <CreateDialog forms={forms} onClose={() => setCreating(false)} /> : null}

      {confirm ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/40 p-4" onClick={() => setConfirm(null)}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="delete-automation-title" onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 id="delete-automation-title" className="text-lg font-semibold">Delete this automation?</h2>
            <p className="mt-1 text-sm text-slate-600">&quot;{confirm.name}&quot;, its queued emails and its send history will be permanently deleted.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" autoFocus onClick={() => setConfirm(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="button" onClick={() => { const id = confirm.id; setConfirm(null); run(() => deleteAutomationAction(id)); }} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
