"use client";

import { Download, ExternalLink, FileDown, Inbox, Search, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useOptimistic, useState, useTransition } from "react";
import type { ActionState } from "@/lib/admin/actionState";
import type { SubmissionRecord } from "@/lib/forms/store";
import { Notice } from "../../../../_components/forms";
import { deleteSubmissionsAction, getSubmissionFileUrlAction } from "../../actions";

type Row = SubmissionRecord & { dateLabel: string };

function DetailDrawer({ row, canOpenEntry, onClose }: { row: Row; canOpenEntry: boolean; onClose: () => void }) {
  const [fileError, setFileError] = useState<string | null>(null);
  const [, start] = useTransition();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function openFile(path: string) {
    setFileError(null);
    start(async () => {
      const result = await getSubmissionFileUrlAction(row.form_id, row.id, path);
      if (result.url) window.location.href = result.url;
      else setFileError(result.error ?? "Couldn't open this file.");
    });
  }

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-slate-950/40" onClick={onClose}>
      <aside role="dialog" aria-modal="true" aria-labelledby="response-title" onClick={(e) => e.stopPropagation()} className="flex h-full w-full max-w-lg flex-col bg-white shadow-xl">
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 id="response-title" className="font-semibold">Response</h2>
            <p className="text-xs text-slate-500">{row.dateLabel} UTC · via {row.source === "embed" ? "embed" : "public link"}</p>
          </div>
          <button type="button" autoFocus aria-label="Close" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
            <X className="size-5" aria-hidden />
          </button>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {row.entry_id && canOpenEntry ? (
            <Link href={`/admin/entries/${row.entry_id}`} className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-100">
              Open webpage entry <ExternalLink className="size-4" aria-hidden />
            </Link>
          ) : null}
          {fileError ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{fileError}</p> : null}
          <dl className="space-y-4">
            {row.answers.map((answer) => (
              <div key={answer.fieldId}>
                <dt className="text-xs font-medium text-slate-500">{answer.label}</dt>
                {answer.files?.length ? (
                  <dd className="mt-1 space-y-1">
                    {answer.files.map((file) => (
                      <button key={file.path} type="button" onClick={() => openFile(file.path)} className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                        <FileDown className="size-4 shrink-0 text-slate-500" aria-hidden />
                        <span className="min-w-0 truncate">{file.name}</span>
                        <span className="ml-auto shrink-0 text-xs text-slate-500">{(file.size / 1024).toFixed(0)} KB</span>
                      </button>
                    ))}
                  </dd>
                ) : (
                  <dd className="mt-0.5 whitespace-pre-wrap break-words text-sm text-slate-900">{answer.display || "—"}</dd>
                )}
              </div>
            ))}
          </dl>
        </div>
      </aside>
    </div>
  );
}

export function SubmissionsTable({ formId, rows: serverRows, canDelete, canOpenEntry }: { formId: string; rows: Row[]; canDelete: boolean; canOpenEntry: boolean }) {
  const [rows, removeOptimistic] = useOptimistic(serverRows, (current: Row[], ids: string[]) => current.filter((r) => !ids.includes(r.id)));
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmIds, setConfirmIds] = useState<string[] | null>(null);
  const [notice, setNotice] = useState<ActionState>({});
  const [, start] = useTransition();

  const columns = useMemo(() => {
    const seen = new Map<string, string>();
    for (const row of rows) {
      for (const answer of row.answers) if (!seen.has(answer.fieldId)) seen.set(answer.fieldId, answer.label);
    }
    return [...seen.entries()].slice(0, 4);
  }, [rows]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) => r.answers.some((a) => a.display.toLowerCase().includes(term)));
  }, [rows, query]);

  const open = rows.find((r) => r.id === openId) ?? null;
  const selectedIds = visible.filter((r) => selected.has(r.id)).map((r) => r.id);
  const allSelected = visible.length > 0 && selectedIds.length === visible.length;

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function remove(ids: string[]) {
    setConfirmIds(null);
    setSelected(new Set());
    setNotice({});
    start(async () => {
      removeOptimistic(ids);
      try {
        setNotice(await deleteSubmissionsAction(formId, ids));
      } catch {
        setNotice({ error: "Couldn't delete these responses." });
      }
    });
  }

  if (rows.length === 0) {
    return (
      <div className="space-y-4">
        <Notice state={notice} />
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <Inbox className="mx-auto size-8 text-slate-400" aria-hidden />
          <p className="mt-3 font-medium text-slate-700">No responses yet</p>
          <p className="mt-1 text-sm text-slate-500">Publish and share your form to start collecting them.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="relative block w-full sm:max-w-sm">
          <span className="sr-only">Search responses</span>
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search responses" className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15" />
        </label>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">{visible.length} of {rows.length}</span>
          <a href={`/admin/forms/${formId}/export`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            <Download className="size-4" aria-hidden /> Export CSV
          </a>
        </div>
      </div>

      <Notice state={notice} />

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs font-medium text-slate-500">
            <tr>
              {canDelete ? (
                <th scope="col" className="w-10 py-3 pl-4">
                  <input type="checkbox" aria-label="Select all responses" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(visible.map((r) => r.id)))} className="size-4 accent-teal-700" />
                </th>
              ) : null}
              {columns.map(([id, label]) => <th key={id} scope="col" className="max-w-48 truncate px-3 py-3 font-medium">{label}</th>)}
              <th scope="col" className="px-3 py-3 font-medium">Date</th>
              <th scope="col" className="py-3 pr-4"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map((row) => (
              <tr key={row.id} className={`transition-colors ${selected.has(row.id) ? "bg-teal-50/60" : "hover:bg-slate-50"}`}>
                {canDelete ? (
                  <td className="py-3 pl-4">
                    <input type="checkbox" aria-label="Select response" checked={selected.has(row.id)} onChange={() => toggle(row.id)} className="size-4 accent-teal-700" />
                  </td>
                ) : null}
                {columns.map(([id]) => (
                  <td key={id} className="max-w-48 truncate px-3 py-3 text-slate-700">{row.answers.find((a) => a.fieldId === id)?.display || "—"}</td>
                ))}
                <td className="whitespace-nowrap px-3 py-3 text-slate-600">{row.dateLabel.split(",").slice(0, 2).join(",")}</td>
                <td className="py-3 pr-4 text-right">
                  <button type="button" onClick={() => setOpenId(row.id)} className="rounded-lg bg-teal-700 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-teal-800">View</button>
                </td>
              </tr>
            ))}
            {visible.length === 0 ? (
              <tr><td colSpan={columns.length + 3} className="px-4 py-8 text-center text-slate-500">No matching responses.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {selectedIds.length > 0 ? (
        <div className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-md items-center justify-between gap-2 rounded-xl bg-slate-900 px-3 py-2 text-white shadow-xl">
          <span className="px-2 text-sm font-medium">{selectedIds.length} selected</span>
          <span className="flex items-center">
            <button type="button" onClick={() => setConfirmIds(selectedIds)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-300 hover:bg-white/10"><Trash2 className="size-4" aria-hidden /> Delete</button>
            <button type="button" aria-label="Clear selection" onClick={() => setSelected(new Set())} className="rounded-lg p-2 hover:bg-white/10"><X className="size-4" aria-hidden /></button>
          </span>
        </div>
      ) : null}

      {open ? <DetailDrawer row={open} canOpenEntry={canOpenEntry} onClose={() => setOpenId(null)} /> : null}

      {confirmIds ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/40 p-4" onClick={() => setConfirmIds(null)}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="delete-responses-title" onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 id="delete-responses-title" className="text-lg font-semibold">Delete {confirmIds.length === 1 ? "this response" : `${confirmIds.length} responses`}?</h2>
            <p className="mt-1 text-sm text-slate-600">Answers and uploaded files are permanently deleted. Linked webpage entries are kept.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" autoFocus onClick={() => setConfirmIds(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="button" onClick={() => remove(confirmIds)} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
