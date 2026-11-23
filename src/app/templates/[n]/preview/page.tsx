import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTemplateCopy } from "@/lib/sanity/queries";
import { resolveTokens, siteTokenValues } from "@/lib/tokens";
import { getTemplateMeta, isLiveTemplate, TEMPLATE_CATALOG } from "@/templates/catalog";
import { hasTemplateComponent, TemplateView } from "@/templates/registry";
import { sampleSite } from "@/templates/sample";

type Props = { params: Promise<{ n: string }> };

export async function generateStaticParams() {
  return TEMPLATE_CATALOG.map((t) => ({ n: String(t.number) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { n } = await params;
  return {
    title: `Preview — ${getTemplateMeta(Number(n))?.name ?? "Template"}`,
    robots: { index: false, follow: false },
  };
}

export default async function PreviewPage({ params }: Props) {
  const n = Number((await params).n);
  if (!isLiveTemplate(n) || !hasTemplateComponent(n)) notFound();
  const copy = await getTemplateCopy(n);
  if (!copy) notFound();
  const site = sampleSite(n);
  return (
    <>
      <div className="bg-slate-900 py-2 text-center text-xs font-medium text-white">
        Template preview with sample details — your own information replaces it.
      </div>
      <TemplateView templateNumber={n} site={site} copy={resolveTokens(copy, siteTokenValues(site))} />
    </>
  );
}
