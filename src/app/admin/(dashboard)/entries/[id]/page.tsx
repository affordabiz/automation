import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requirePermission } from "@/lib/admin/auth";
import { formatDate } from "@/lib/admin/data";
import { hasPermission } from "@/lib/admin/permissions";
import { entryImages, getEntry, listContactMessages } from "@/lib/entries/store";
import { getTemplateMeta } from "@/templates/catalog";
import { StatusBadge } from "../../../_components/StatusBadge";
import {
  approveEntryAction,
  rejectEntryAction,
  resendClientEmailAction,
  restoreWebpageAction,
  suspendWebpageAction,
} from "../actions";
import { ConfirmAction, ResendEmail, ReviewActions } from "../EntryActions";

export const metadata: Metadata = { title: "Entry" };

const EMAIL_LABELS = { sent: "Sent", failed: "Failed", not_sent: "Not sent (dry-run)" } as const;

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm">{value}</dd>
    </div>
  );
}

export default async function EntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await requirePermission("entries.view");
  if (!z.uuid().safeParse(id).success) notFound();
  const entry = await getEntry(id);
  if (!entry) notFound();

  const [images, messages] = await Promise.all([entryImages(entry), listContactMessages(entry.id)]);
  const canReview = hasPermission(actor, "entries.review");
  const canManage = hasPermission(actor, "webpages.manage");
  const canResend = canReview && (entry.status === "approved" || (entry.status === "rejected" && Boolean(entry.review_note)));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href={`/admin/entries?status=${entry.status}`} className="text-sm font-medium text-teal-800 hover:underline">← Back to entries</Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{entry.business_name}</h1>
            <StatusBadge status={entry.status} />
          </div>
          <p className="mt-1 text-sm text-slate-600">Submitted {formatDate(entry.created_at)} UTC through {entry.forms.name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/admin/preview/${entry.id}`} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-900">
            Preview webpage
          </a>
          {entry.status === "approved" ? (
            <a href={`/${entry.slug}`} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Open live page
            </a>
          ) : null}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 font-semibold">Submitted details</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail label="Full name" value={entry.full_name} />
              <Detail label="Business" value={entry.business_name} />
              <Detail label="Email" value={entry.email} />
              <Detail label="Phone" value={entry.phone} />
              <Detail label="Address" value={entry.address} />
              <Detail label="Serving area" value={entry.serving_area} />
              <Detail label="Web address" value={`/${entry.slug}`} />
              <Detail label="Template" value={getTemplateMeta(entry.template_number)?.name ?? `Template ${entry.template_number}`} />
            </dl>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 font-semibold">Images</h2>
            {images ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <figure>
                  {/* eslint-disable-next-line @next/next/no-img-element -- Reviewer images use short-lived signed URLs. */}
                  <img src={images.logoUrl} alt={`${entry.business_name} logo`} className="h-44 w-full rounded-lg border border-slate-200 bg-slate-50 object-contain p-2" />
                  <figcaption className="mt-1 text-xs text-slate-500">Logo</figcaption>
                </figure>
                <figure>
                  {/* eslint-disable-next-line @next/next/no-img-element -- Reviewer images use short-lived signed URLs. */}
                  <img src={images.photoUrl} alt={entry.full_name} className="h-44 w-full rounded-lg border border-slate-200 bg-slate-50 object-contain p-2" />
                  <figcaption className="mt-1 text-xs text-slate-500">Photo</figcaption>
                </figure>
              </div>
            ) : (
              <p className="text-sm text-red-700">The images couldn&apos;t be loaded.</p>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 font-semibold">Enquiries ({messages.length})</h2>
            {messages.length === 0 ? (
              <p className="text-sm text-slate-500">No enquiries yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {messages.map((m) => (
                  <li key={m.id} className="py-3 text-sm">
                    <p className="font-medium">{m.name} · {m.email}{m.phone ? ` · ${m.phone}` : ""}</p>
                    <p className="mt-1 whitespace-pre-wrap text-slate-700">{m.message}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatDate(m.created_at)} UTC · Email {m.email_status}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          {entry.status === "pending" && canReview ? (
            <ReviewActions approve={approveEntryAction.bind(null, entry.id)} reject={rejectEntryAction.bind(null, entry.id)} />
          ) : null}

          {entry.status !== "pending" ? (
            <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="font-semibold">Review outcome</h2>
              <dl className="space-y-3">
                <Detail label="Reviewed by" value={entry.reviewed_by_email ?? (entry.source === "sanity" ? "Imported from Sanity" : "—")} />
                {entry.reviewed_at ? <Detail label="Reviewed" value={`${formatDate(entry.reviewed_at)} UTC`} /> : null}
                {entry.review_note ? <Detail label="Reason" value={entry.review_note} /> : null}
                {entry.client_email_status ? <Detail label="Client email" value={EMAIL_LABELS[entry.client_email_status]} /> : null}
              </dl>
              {canResend ? <ResendEmail action={resendClientEmailAction.bind(null, entry.id)} /> : null}
            </section>
          ) : null}

          {canManage && entry.status === "approved" ? (
            <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="font-semibold">Webpage</h2>
              <ConfirmAction action={suspendWebpageAction.bind(null, entry.id)} label="Suspend webpage" confirmLabel="Confirm: take offline" />
            </section>
          ) : null}
          {canManage && entry.status === "suspended" ? (
            <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="font-semibold">Webpage</h2>
              <ConfirmAction action={restoreWebpageAction.bind(null, entry.id)} label="Restore webpage" confirmLabel="Confirm: put back online" />
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
