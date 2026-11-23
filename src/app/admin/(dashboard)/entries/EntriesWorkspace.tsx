"use client";

import { ChevronRight, EllipsisVertical, FileText, Globe, LoaderCircle, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useOptimistic, useRef, useState, useTransition } from "react";
import type { ActionState } from "@/lib/admin/actionState";
import { ENTRY_STATUS_LABELS, ENTRY_STATUSES, type EntryListItem, type EntryStatus } from "@/lib/entries/mapping";
import { StatusBadge } from "../../_components/StatusBadge";
import { deleteEntriesAction, draftEntriesAction, publishEntriesAction, setAutoPublishAction } from "./actions";

type Row = EntryListItem & { dateLabel: string };
type Operation = { type: "status"; ids: string[]; status: EntryStatus } | { type: "remove"; ids: string[] };

function applyOperation(rows: Row[], op: Operation): Row[] {
  if (op.type === "remove") return rows.filter((r) => !op.ids.includes(r.id));
  return rows.map((r) => (op.ids.includes(r.id) ? { ...r, status: op.status } : r));
}

function ReviewLink({ id, status, className = "" }: { id: string; status: EntryStatus; className?: string }) {
  const [intent, setIntent] = useState(false);
  return (
    <Link
      href={`/admin/entries/${id}`}
      prefetch={intent}
      onMouseEnter={() => setIntent(true)}
      onFocus={() => setIntent(true)}
      onTouchStart={() => setIntent(true)}
      className={`inline-flex items-center justify-center gap-1 rounded-lg bg-teal-700 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${className}`}
    >
      {status === "pending" ? "Review" : "Open"}
      <ChevronRight className="size-4" aria-hidden />
    </Link>
  );
}

function RowMenu({
  row,
  canReview,
  canDelete,
  onPublish,
  onDraft,
  onDelete,
}: {
  row: Row;
  canReview: boolean;
  canDelete: boolean;
  onPublish: () => void;
  onDraft: () => void;
  onDelete: () => void;
}) {
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null);
  const menu = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!position) return;
    const close = () => setPosition(null);
    const onPointer = (e: PointerEvent) => {
      if (!menu.current?.contains(e.target as Node) && !trigger.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    menu.current?.querySelector("button")?.focus();
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [position]);

  if (!canReview && !canDelete) return null;
  const item = "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium";
  const run = (action: () => void) => {
    setPosition(null);
    action();
  };

  return (
    <>
      <button
        ref={trigger}
        type="button"
        aria-label={`More actions for ${row.business_name}`}
        aria-haspopup="menu"
        aria-expanded={Boolean(position)}
        onClick={(e) => {
          if (position) return setPosition(null);
          const rect = e.currentTarget.getBoundingClientRect();
          const menuHeight = 140;
          const top = rect.bottom + menuHeight + 8 > window.innerHeight ? rect.top - menuHeight - 4 : rect.bottom + 4;
          setPosition({ top, right: window.innerWidth - rect.right });
        }}
        className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-teal-700"
      >
        <EllipsisVertical className="size-4" aria-hidden />
      </button>
      {position ? (
        <div
          ref={menu}
          role="menu"
          style={{ top: position.top, right: position.right }}
          className="fixed z-50 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
        >
          {canReview && row.status !== "approved" ? (
            <button type="button" role="menuitem" onClick={() => run(onPublish)} className={`${item} text-slate-700 hover:bg-slate-100`}>
              <Globe className="size-4" aria-hidden /> Publish
            </button>
          ) : null}
          {canReview && row.status !== "draft" ? (
            <button type="button" role="menuitem" onClick={() => run(onDraft)} className={`${item} text-slate-700 hover:bg-slate-100`}>
              <FileText className="size-4" aria-hidden /> Move to Draft
            </button>
          ) : null}
          {canDelete ? (
            <button type="button" role="menuitem" onClick={() => run(onDelete)} className={`${item} text-red-700 hover:bg-red-50`}>
              <Trash2 className="size-4" aria-hidden /> Delete
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

function DeleteDialog({ count, onCancel, onConfirm }: { count: number; onCancel: () => void; onConfirm: () => void }) {
  const cancel = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    cancel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);
  const label = count === 1 ? "this entry" : `${count} entries`;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/40 p-4" onClick={onCancel}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-title"
        aria-describedby="delete-description"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="grid size-10 place-items-center rounded-full bg-red-50 text-red-600">
          <Trash2 className="size-5" aria-hidden />
        </div>
        <h2 id="delete-title" className="mt-4 text-lg font-semibold">Delete {label}?</h2>
        <p id="delete-description" className="mt-1 text-sm text-slate-600">
          Any live webpage goes offline. Details, images, messages and enquiries are permanently deleted.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button ref={cancel} type="button" onClick={onCancel} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export function EntriesWorkspace(props: {
  rows: Row[];
  initialStatus: EntryStatus;
  autoPublish: boolean;
  canSetAuto: boolean;
  canReview: boolean;
  canDelete: boolean;
}) {
  const [rows, applyOptimistic] = useOptimistic(props.rows, applyOperation);
  const [autoPublish, setOptimisticAuto] = useOptimistic(props.autoPublish);
  const [status, setStatus] = useState<EntryStatus>(props.initialStatus);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [deleteIds, setDeleteIds] = useState<string[] | null>(null);
  const [notice, setNotice] = useState<ActionState | null>(null);
  const [pending, startTransition] = useTransition();

  const counts = useMemo(() => {
    const totals: Record<EntryStatus, number> = { approved: 0, pending: 0, draft: 0, suspended: 0 };
    for (const r of rows) totals[r.status]++;
    return totals;
  }, [rows]);
  const visible = useMemo(() => rows.filter((r) => r.status === status), [rows, status]);
  const selectedRows = visible.filter((r) => selected.has(r.id));
  const allSelected = visible.length > 0 && selectedRows.length === visible.length;

  function changeFilter(next: EntryStatus) {
    setStatus(next);
    setSelected(new Set());
    window.history.replaceState(null, "", `/admin/entries?status=${next}`);
  }

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function run(op: Operation, action: (ids: string[]) => Promise<ActionState>) {
    setSelected(new Set());
    setNotice(null);
    startTransition(async () => {
      applyOptimistic(op);
      try {
        setNotice(await action(op.ids));
      } catch {
        setNotice({ error: "Something went wrong. Please try again." });
      }
    });
  }

  const publish = (ids: string[]) => run({ type: "status", ids, status: "approved" }, publishEntriesAction);
  const draft = (ids: string[]) => run({ type: "status", ids, status: "draft" }, draftEntriesAction);

  function toggleAuto() {
    const next = !autoPublish;
    setNotice(null);
    startTransition(async () => {
      setOptimisticAuto(next);
      try {
        setNotice(await setAutoPublishAction(next));
      } catch {
        setNotice({ error: "Couldn't save this setting." });
      }
    });
  }

  const selectedIds = selectedRows.map((r) => r.id);
  const bulkButton = "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-white/10";

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-20">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Entries</h1>
          <p className="mt-0.5 text-sm text-slate-500">Review, edit and publish client webpages.</p>
        </div>
        {props.canSetAuto ? (
          <div className="flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-2.5 sm:w-auto">
            <div>
              <p id="auto-publish-label" className="text-sm font-semibold">Auto-publish</p>
              <p className="text-xs text-slate-500">{autoPublish ? "New entries go live instantly" : "Manual review required"}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={autoPublish}
              aria-labelledby="auto-publish-label"
              onClick={toggleAuto}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${autoPublish ? "bg-teal-600" : "bg-slate-300"}`}
            >
              <span className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform ${autoPublish ? "translate-x-5" : ""}`} />
            </button>
          </div>
        ) : null}
      </header>

      <div role="tablist" aria-label="Filter entries by status" className="-mx-1 flex gap-1 overflow-x-auto border-b border-slate-200 px-1">
        {ENTRY_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={s === status}
            onClick={() => changeFilter(s)}
            className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition ${s === status ? "border-teal-700 text-teal-800" : "border-transparent text-slate-500 hover:text-slate-900"}`}
          >
            {ENTRY_STATUS_LABELS[s]}
            <span className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${s === status ? "bg-teal-50 text-teal-800" : "bg-slate-100 text-slate-600"}`}>{counts[s]}</span>
          </button>
        ))}
      </div>

      {notice?.error || notice?.message ? (
        <div role={notice.error ? "alert" : "status"} className={`flex items-start justify-between gap-3 rounded-lg px-4 py-2.5 text-sm ${notice.error ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-900"}`}>
          <p>{notice.error ?? notice.message}</p>
          <button type="button" aria-label="Dismiss" onClick={() => setNotice(null)} className="shrink-0 rounded p-0.5 hover:bg-black/5">
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ) : null}

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="font-medium text-slate-700">No {ENTRY_STATUS_LABELS[status].toLowerCase()} entries</p>
          <p className="mt-1 text-sm text-slate-500">Entries with this status will appear here.</p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs font-medium text-slate-500">
                <tr>
                  <th scope="col" className="w-10 py-3 pl-4">
                    <input
                      type="checkbox"
                      aria-label="Select all entries"
                      checked={allSelected}
                      onChange={() => setSelected(allSelected ? new Set() : new Set(visible.map((r) => r.id)))}
                      className="size-4 rounded accent-teal-700"
                    />
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">Name</th>
                  <th scope="col" className="px-3 py-3 font-medium">Business Name</th>
                  <th scope="col" className="px-3 py-3 font-medium">Template</th>
                  <th scope="col" className="px-3 py-3 font-medium">Slug</th>
                  <th scope="col" className="px-3 py-3 font-medium">Date</th>
                  <th scope="col" className="px-3 py-3 font-medium">Status</th>
                  <th scope="col" className="py-3 pr-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((r) => (
                  <tr key={r.id} className={`transition-colors ${selected.has(r.id) ? "bg-teal-50/60" : "hover:bg-slate-50"}`}>
                    <td className="py-3 pl-4">
                      <input type="checkbox" aria-label={`Select ${r.business_name}`} checked={selected.has(r.id)} onChange={() => toggle(r.id)} className="size-4 rounded accent-teal-700" />
                    </td>
                    <td className="max-w-40 truncate px-3 py-3 font-medium text-slate-900">{r.full_name}</td>
                    <td className="max-w-48 truncate px-3 py-3 text-slate-700">{r.business_name}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-slate-600">Template {r.template_number}</td>
                    <td className="max-w-40 truncate px-3 py-3 font-mono text-xs text-slate-600">/{r.slug}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-slate-600">{r.dateLabel.split(",").slice(0, 2).join(",")}</td>
                    <td className="px-3 py-3"><StatusBadge status={r.status} /></td>
                    <td className="py-3 pr-3">
                      <div className="flex items-center justify-end gap-1">
                        <ReviewLink id={r.id} status={r.status} />
                        <RowMenu row={r} canReview={props.canReview} canDelete={props.canDelete} onPublish={() => publish([r.id])} onDraft={() => draft([r.id])} onDelete={() => setDeleteIds([r.id])} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {visible.map((r) => (
              <li key={r.id} className={`rounded-2xl border bg-white p-4 ${selected.has(r.id) ? "border-teal-600" : "border-slate-200"}`}>
                <div className="flex items-start gap-3">
                  <input type="checkbox" aria-label={`Select ${r.business_name}`} checked={selected.has(r.id)} onChange={() => toggle(r.id)} className="mt-1 size-4 shrink-0 rounded accent-teal-700" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">{r.business_name}</p>
                    <p className="truncate text-sm text-slate-500">{r.full_name}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-500">
                  <div><dt className="sr-only">Template</dt><dd>Template {r.template_number}</dd></div>
                  <div className="text-right"><dt className="sr-only">Date</dt><dd>{r.dateLabel.split(",").slice(0, 2).join(",")}</dd></div>
                  <div className="col-span-2"><dt className="sr-only">Slug</dt><dd className="truncate font-mono">/{r.slug}</dd></div>
                </dl>
                <div className="mt-3 flex items-center gap-2">
                  <ReviewLink id={r.id} status={r.status} className="flex-1" />
                  <RowMenu row={r} canReview={props.canReview} canDelete={props.canDelete} onPublish={() => publish([r.id])} onDraft={() => draft([r.id])} onDelete={() => setDeleteIds([r.id])} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {selectedIds.length > 0 ? (
        <div className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-xl flex-wrap items-center justify-between gap-1 rounded-xl bg-slate-900 px-3 py-2 text-white shadow-xl" style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}>
          <span className="px-2 text-sm font-medium">{selectedIds.length} selected</span>
          <div className="flex flex-wrap items-center">
            {props.canReview && selectedRows.some((r) => r.status !== "approved") ? (
              <button type="button" onClick={() => publish(selectedRows.filter((r) => r.status !== "approved").map((r) => r.id))} className={bulkButton}>
                <Globe className="size-4" aria-hidden /> Publish
              </button>
            ) : null}
            {props.canReview && selectedRows.some((r) => r.status !== "draft") ? (
              <button type="button" onClick={() => draft(selectedRows.filter((r) => r.status !== "draft").map((r) => r.id))} className={bulkButton}>
                <FileText className="size-4" aria-hidden /> Draft
              </button>
            ) : null}
            {props.canDelete ? (
              <button type="button" onClick={() => setDeleteIds(selectedIds)} className={`${bulkButton} text-red-300`}>
                <Trash2 className="size-4" aria-hidden /> Delete
              </button>
            ) : null}
            <button type="button" aria-label="Clear selection" onClick={() => setSelected(new Set())} className="rounded-lg p-2 hover:bg-white/10">
              <X className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      ) : null}

      {pending ? (
        <div role="status" className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
          <LoaderCircle className="size-3.5 animate-spin" aria-hidden /> Saving
        </div>
      ) : null}

      {deleteIds ? (
        <DeleteDialog
          count={deleteIds.length}
          onCancel={() => setDeleteIds(null)}
          onConfirm={() => {
            const ids = deleteIds;
            setDeleteIds(null);
            run({ type: "remove", ids }, deleteEntriesAction);
          }}
        />
      ) : null}
    </div>
  );
}
