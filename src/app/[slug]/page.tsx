import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteBySlug } from "@/lib/entries/live";
import { getTemplateCopy } from "@/lib/sanity/queries";
import { isValidSlugFormat } from "@/lib/slug";
import { resolveTokens, siteTokenValues } from "@/lib/tokens";
import { isLiveTemplate } from "@/templates/catalog";
import { hasTemplateComponent, TemplateView } from "@/templates/registry";

type Props = { params: Promise<{ slug: string }> };

/** Cache Components requires at least one param; real slugs render on demand and are cached by tag. */
export async function generateStaticParams() {
  return [{ slug: "__placeholder__" }];
}

async function load(slug: string) {
  if (!isValidSlugFormat(slug)) return null;
  const site = await getSiteBySlug(slug);
  if (!site || !isLiveTemplate(site.templateNumber)) return null;
  if (!hasTemplateComponent(site.templateNumber)) return null;
  const copy = await getTemplateCopy(site.templateNumber);
  if (!copy) return null;
  return { site, copy: resolveTokens(copy, siteTokenValues(site)) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) return { title: "Page not found" };
  return {
    title: data.site.businessName,
    description: `${data.site.businessName} — serving ${data.site.servingArea}. Call ${data.site.phone}.`,
    openGraph: { title: data.site.businessName, images: [data.site.photoUrl] },
  };
}

export default async function SitePage({ params }: Props) {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) notFound();
  const { site, copy } = data;
  return <TemplateView templateNumber={site.templateNumber} site={site} copy={copy} />;
}
