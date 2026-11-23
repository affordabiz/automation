import { cacheLife, cacheTag } from "next/cache";
import { defineQuery } from "next-sanity";
import { readClient } from "./client";
import { mergeCopy } from "@/lib/mergeCopy";
import { getDefaultCopy } from "@/templates/defaults";
import type { SiteData, TemplateCopy } from "@/templates/types";

export interface SiteRow {
  id: string;
  slug: string;
  templateNumber: number | null;
  fullName: string | null;
  businessName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  servingArea: string | null;
  logoUrl: string | null;
  photoUrl: string | null;
}

const SITE_QUERY = defineQuery(`*[_type == "site" && slug.current == $slug && published == true][0]{
  "id": _id, "slug": slug.current, templateNumber, fullName, businessName, email, phone, address, servingArea,
  "logoUrl": logo.asset->url, "photoUrl": photo.asset->url
}`);

const TEMPLATE_COPY_QUERY = defineQuery(`*[_type == "template" && number == $n][0].copy`);

export function toSiteData(row: SiteRow): SiteData | null {
  const n = row.templateNumber;
  if (!n || n < 1 || n > 7 || !row.logoUrl || !row.photoUrl) return null;
  return {
    id: row.id,
    slug: row.slug,
    templateNumber: n,
    fullName: row.fullName ?? "",
    businessName: row.businessName ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    address: row.address ?? "",
    servingArea: row.servingArea ?? "",
    logoUrl: row.logoUrl,
    photoUrl: row.photoUrl,
  };
}

export async function getSiteBySlug(slug: string): Promise<SiteData | null> {
  "use cache";
  cacheTag(`site:${slug}`);
  cacheLife("max");
  const row = await readClient.fetch<SiteRow | null>(SITE_QUERY, { slug });
  return row ? toSiteData(row) : null;
}

export async function getTemplateCopy(n: number): Promise<TemplateCopy | null> {
  "use cache";
  cacheTag("templates");
  cacheLife("max");
  const defaults = getDefaultCopy(n);
  if (!defaults) return null;
  const cms = await readClient.fetch<unknown>(TEMPLATE_COPY_QUERY, { n });
  return mergeCopy(defaults, cms);
}
