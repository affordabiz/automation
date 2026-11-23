import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { requirePermission } from "@/lib/admin/auth";
import { ENTRY_STATUS_LABELS, toSiteData } from "@/lib/entries/mapping";
import { entryImages, getEntry } from "@/lib/entries/store";
import { getTemplateCopy } from "@/lib/sanity/queries";
import { resolveTokens, siteTokenValues } from "@/lib/tokens";
import { hasTemplateComponent, TemplateView } from "@/templates/registry";

export const metadata: Metadata = { title: "Webpage preview" };

type Props = { params: Promise<{ id: string }> };

async function Preview({ params }: Props) {
  const { id } = await params;
  await requirePermission("entries.view");
  if (!z.uuid().safeParse(id).success) notFound();
  const entry = await getEntry(id);
  if (!entry || !hasTemplateComponent(entry.template_number)) notFound();

  const images = await entryImages(entry);
  const mapped = images ? toSiteData(entry, images) : null;
  const copy = await getTemplateCopy(entry.template_number);
  if (!mapped || !copy) notFound();

  // A null slug disables the contact form, so previews can't send real enquiries.
  const site = { ...mapped, id: null, slug: null };
  return (
    <>
      <div className="bg-amber-400 px-4 py-2 text-center text-sm font-semibold text-slate-900">
        Private preview · {ENTRY_STATUS_LABELS[entry.status]} · /{entry.slug}
      </div>
      <TemplateView templateNumber={site.templateNumber} site={site} copy={resolveTokens(copy, siteTokenValues(site))} />
    </>
  );
}

export default function EntryPreviewPage({ params }: Props) {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-slate-500">Loading preview…</p>}>
      <Preview params={params} />
    </Suspense>
  );
}
