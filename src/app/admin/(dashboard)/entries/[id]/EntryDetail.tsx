"use client";

import { ArrowLeft, Check, Eye, Globe, ImagePlus, LoaderCircle, Pencil, Trash2, X } from "lucide-react";
import Link from "next/link";
import { startTransition as startFormTransition, useActionState, useState, useTransition, type FormEvent, type ReactNode } from "react";
import type { ActionState } from "@/lib/admin/actionState";
import type { EntryStatus } from "@/lib/entries/mapping";
import { inputClass, labelClass, Notice } from "../../../_components/forms";
import { StatusBadge } from "../../../_components/StatusBadge";
import { publishEntriesAction, updateEntryAction } from "../actions";

interface EntryView {
  id: string;
  status: EntryStatus;
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  address: string;
  servingArea: string;
  slug: string;
  templateNumber: number;
  submitted: string;
}

interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  email_status: "sent" | "failed";
  dateLabel: string;
}

const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700";
const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-60";

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className={`mt-0.5 break-words text-sm text-slate-900 ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}

function ImageEditor({ name, label, current, accept }: { name: "logo" | "photo"; label: string; current: string | null; accept: string }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const shown = preview ?? (removed ? null : current);
  return (
    <div>
      <p className={labelClass}>{label}</p>
      <div className="relative mt-1 grid h-40 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element -- local or signed image preview
          <img src={shown} alt={`${label} preview`} className="size-full object-contain p-2" />
        ) : (
          <ImagePlus className="size-7 text-slate-400" aria-hidden />
        )}
      </div>
      <div className="mt-2 flex gap-2">
        <label className={`${secondaryButton} flex-1 cursor-pointer px-3 py-1.5 focus-within:outline-2 focus-within:outline-teal-700`}>
          <ImagePlus className="size-4" aria-hidden />
          {shown ? "Replace" : "Upload"}
          <input
            type="file"
            name={name}
            accept={accept}
            className="sr-only"
            onChange={(e) => {
              if (preview) URL.revokeObjectURL(preview);
              const file = e.target.files?.[0];
              setPreview(file ? URL.createObjectURL(file) : null);
              if (file) setRemoved(false);
            }}
          />
        </label>
        {shown ? (
          <button
            type="button"
            aria-label={`Remove ${label.toLowerCase()}`}
            onClick={(e) => {
              if (preview) URL.revokeObjectURL(preview);
              setPreview(null);
              setRemoved(true);
              const input = e.currentTarget.parentElement?.querySelector<HTMLInputElement>("input[type=file]");
              if (input) input.value = "";
            }}
            className="grid size-9 place-items-center rounded-lg border border-red-200 bg-white text-red-600 transition hover:bg-red-50"
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        ) : null}
      </div>
      {removed && !preview ? <input type="hidden" name={`remove_${name}`} value="1" /> : null}
    </div>
  );
}

function SaveButtons({ showPublish, pending, onCancel }: { showPublish: boolean; pending: boolean; onCancel: () => void }) {
  return (
    <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
      <button type="button" onClick={onCancel} disabled={pending} className={secondaryButton}>Cancel</button>
      <button type="submit" name="intent" value="save" disabled={pending} className={showPublish ? secondaryButton : primaryButton}>
        {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null} Save
      </button>
      {showPublish ? (
        <button type="submit" name="intent" value="publish" disabled={pending} className={primaryButton}>
          <Globe className="size-4" aria-hidden /> Save and publish
        </button>
      ) : null}
    </div>
  );
}

function EditForm({
  entry,
  images,
  templates,
  onDone,
  onCancel,
}: {
  entry: EntryView;
  images: { logoUrl: string | null; photoUrl: string | null };
  templates: { number: number; label: string }[];
  onDone: (state: ActionState) => void;
  onCancel: () => void;
}) {
  const [state, action, saving] = useActionState(async (previous: ActionState, form: FormData) => {
    const result = await updateEntryAction(entry.id, previous, form);
    if (!result.error) onDone(result);
    return result;
  }, {});
  // Submitting manually keeps typed values and chosen images if validation fails.
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
    startFormTransition(() => action(data));
  };
  const text = (name: string, label: string, value: string, type = "text", maxLength = 120) => (
    <div>
      <label htmlFor={`edit-${name}`} className={labelClass}>{label}</label>
      <input id={`edit-${name}`} name={name} type={type} required maxLength={maxLength} defaultValue={value} className={inputClass} />
    </div>
  );
  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="font-semibold">Edit info</h2>
      <Notice state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        {text("fullName", "Full name", entry.fullName, "text", 100)}
        {text("businessName", "Business name", entry.businessName)}
        {text("email", "Email", entry.email, "email", 254)}
        {text("phone", "Phone", entry.phone, "tel", 20)}
        {text("servingArea", "Serving area", entry.servingArea)}
        {text("slug", "Slug", entry.slug, "text", 50)}
        <div>
          <label htmlFor="edit-template" className={labelClass}>Template</label>
          <select id="edit-template" name="templateNumber" defaultValue={entry.templateNumber} className={inputClass}>
            {templates.map((t) => (
              <option key={t.number} value={t.number}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="edit-address" className={labelClass}>Address</label>
          <textarea id="edit-address" name="address" required maxLength={200} rows={2} defaultValue={entry.address} className={inputClass} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <ImageEditor name="logo" label="Logo" current={images.logoUrl} accept="image/png,image/jpeg,image/webp,image/svg+xml" />
        <ImageEditor name="photo" label="Photo" current={images.photoUrl} accept="image/png,image/jpeg,image/webp" />
      </div>
      <SaveButtons showPublish={entry.status !== "approved"} pending={saving} onCancel={onCancel} />
    </form>
  );
}

export function EntryDetail({
  entry,
  images,
  templates,
  canEdit,
  enquiries,
  conversation,
}: {
  entry: EntryView;
  images: { logoUrl: string | null; photoUrl: string | null };
  templates: { number: number; label: string }[];
  canEdit: boolean;
  enquiries: Enquiry[];
  conversation: ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState<ActionState>({});
  const [publishing, startPublish] = useTransition();
  const isActive = entry.status === "approved";

  function publish() {
    setNotice({});
    startPublish(async () => {
      try {
        setNotice(await publishEntriesAction([entry.id]));
      } catch {
        setNotice({ error: "Couldn't publish this entry. Please try again." });
      }
    });
  }

  return (
    <div className="space-y-5">
      <Link
        href={`/admin/entries?status=${entry.status}`}
        className="group inline-flex items-center gap-1.5 rounded-lg py-1 pr-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" aria-hidden />
        Back to Entries
      </Link>

      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="min-w-0 break-words text-2xl font-semibold tracking-tight">{entry.businessName}</h1>
            <StatusBadge status={entry.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">Submitted {entry.submitted} UTC</p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:flex">
          <a href={`/admin/preview/${entry.id}`} target="_blank" rel="noopener noreferrer" className={secondaryButton}>
            <Eye className="size-4" aria-hidden /> Preview
          </a>
          {canEdit ? (
            <button type="button" onClick={() => { setNotice({}); setEditing((v) => !v); }} aria-pressed={editing} className={secondaryButton}>
              {editing ? <X className="size-4" aria-hidden /> : <Pencil className="size-4" aria-hidden />}
              <span className="whitespace-nowrap">{editing ? "Close" : "Edit Info"}</span>
            </button>
          ) : null}
          {canEdit ? (
            <button type="button" onClick={publish} disabled={isActive || publishing} className={primaryButton}>
              {publishing ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : isActive ? <Check className="size-4" aria-hidden /> : <Globe className="size-4" aria-hidden />}
              {isActive ? "Published" : publishing ? "Publishing" : "Publish"}
            </button>
          ) : null}
        </div>
      </header>

      <Notice state={notice} />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-5">
          {editing ? (
            <EditForm
              entry={entry}
              images={images}
              templates={templates}
              onCancel={() => setEditing(false)}
              onDone={(state) => {
                setNotice(state);
                setEditing(false);
              }}
            />
          ) : (
            <>
              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="mb-4 font-semibold">Details</h2>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <Field label="Name" value={entry.fullName} />
                  <Field label="Business Name" value={entry.businessName} />
                  <Field label="Email" value={entry.email} />
                  <Field label="Phone" value={entry.phone} />
                  <Field label="Address" value={entry.address} />
                  <Field label="Serving area" value={entry.servingArea} />
                  <Field label="Slug" value={`/${entry.slug}`} mono />
                  <Field label="Template" value={`Template ${entry.templateNumber}`} />
                </dl>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="mb-4 font-semibold">Images</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { label: "Logo", url: images.logoUrl },
                    { label: "Photo", url: images.photoUrl },
                  ].map((image) => (
                    <figure key={image.label}>
                      <div className="grid h-44 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                        {image.url ? (
                          // eslint-disable-next-line @next/next/no-img-element -- signed storage URL
                          <img src={image.url} alt={`${entry.businessName} ${image.label.toLowerCase()}`} loading="lazy" decoding="async" className="size-full object-contain p-2" />
                        ) : (
                          <span className="text-sm text-slate-500">No {image.label.toLowerCase()}</span>
                        )}
                      </div>
                      <figcaption className="mt-1.5 text-xs text-slate-500">{image.label}</figcaption>
                    </figure>
                  ))}
                </div>
              </section>
            </>
          )}

          {enquiries.length > 0 ? (
            <details className="rounded-2xl border border-slate-200 bg-white p-5">
              <summary className="cursor-pointer font-semibold">Website enquiries ({enquiries.length})</summary>
              <ul className="mt-3 divide-y divide-slate-100">
                {enquiries.map((m) => (
                  <li key={m.id} className="py-3 text-sm">
                    <p className="font-medium">{m.name} · {m.email}{m.phone ? ` · ${m.phone}` : ""}</p>
                    <p className="mt-1 whitespace-pre-wrap text-slate-700">{m.message}</p>
                    <p className="mt-1 text-xs text-slate-500">{m.dateLabel} UTC · Email {m.email_status}</p>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>

        <div className="lg:sticky lg:top-20">{conversation}</div>
      </div>
    </div>
  );
}
