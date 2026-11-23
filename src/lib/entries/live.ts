import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { serviceClient } from "@/lib/supabase/service";
import type { SiteData } from "@/templates/types";
import { toSiteData, type LiveEntryRow } from "./mapping";

const LIVE_COLUMNS = "id,slug,template_number,full_name,business_name,email,phone,address,serving_area,logo_url,photo_url";

/** Only approved entries are public. Review actions expire this cache tag. */
export async function getSiteBySlug(slug: string): Promise<SiteData | null> {
  "use cache";
  cacheTag(`site:${slug}`);
  cacheLife("max");
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await serviceClient()
    .from("entries")
    .select(LIVE_COLUMNS)
    .eq("slug", slug)
    .eq("status", "approved")
    .maybeSingle<LiveEntryRow>();
  if (error) throw new Error(`Could not load webpage: ${error.message}`);
  return data ? toSiteData(data) : null;
}
