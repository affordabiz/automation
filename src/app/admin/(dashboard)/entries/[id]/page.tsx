import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requirePermission } from "@/lib/admin/auth";
import { formatDate } from "@/lib/admin/data";
import { hasPermission } from "@/lib/admin/permissions";
import { entryImages, getEntry, listContactMessages, listEntryMessages } from "@/lib/entries/store";
import { replyAddress } from "@/lib/entries/workflow";
import { TEMPLATE_CATALOG } from "@/templates/catalog";
import { Conversation } from "./Conversation";
import { EntryDetail } from "./EntryDetail";

export const metadata: Metadata = { title: "Entry" };

export default async function EntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await requirePermission("entries.view");
  if (!z.uuid().safeParse(id).success) notFound();
  const entry = await getEntry(id);
  if (!entry) notFound();

  const [images, messages, enquiries] = await Promise.all([
    entryImages(entry),
    listEntryMessages(entry.id),
    listContactMessages(entry.id),
  ]);
  const canEdit = hasPermission(actor, "entries.review");

  return (
    <div className="mx-auto max-w-6xl">
      <EntryDetail
        key={`${entry.id}:${entry.status}:${entry.slug}`}
        entry={{
          id: entry.id,
          status: entry.status,
          fullName: entry.full_name,
          businessName: entry.business_name,
          email: entry.email,
          phone: entry.phone,
          address: entry.address,
          servingArea: entry.serving_area,
          slug: entry.slug,
          templateNumber: entry.template_number,
          submitted: formatDate(entry.created_at),
        }}
        images={images}
        templates={TEMPLATE_CATALOG.filter((t) => t.status === "live" || t.number === entry.template_number).map((t) => ({
          number: t.number,
          label: `Template ${t.number}`,
        }))}
        canEdit={canEdit}
        canDelete={hasPermission(actor, "entries.delete")}
        enquiries={enquiries.map((m) => ({ ...m, dateLabel: formatDate(m.created_at) }))}
        conversation={
          <Conversation
            entryId={entry.id}
            clientName={entry.full_name}
            clientEmail={entry.email}
            canSend={canEdit}
            repliesEnabled={Boolean(replyAddress(entry))}
            messages={messages.map((m) => ({ ...m, dateLabel: formatDate(m.created_at) }))}
          />
        }
      />
    </div>
  );
}
