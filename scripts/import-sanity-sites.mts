/**
 * Copies existing Sanity site documents into Supabase so they stay live.
 * Safe to re-run: web addresses that already exist in Supabase are skipped. Sanity is only read.
 */
import { createClient } from "@supabase/supabase-js";

interface SanitySite {
  slug: string | null;
  templateNumber: number | null;
  fullName: string | null;
  businessName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  servingArea: string | null;
  logoUrl: string | null;
  photoUrl: string | null;
  published: boolean | null;
  createdAt: string | null;
}

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!projectId || !url || !key) throw new Error("Sanity and Supabase environment variables are required.");

const query = `*[_type == "site" && !(_id in path("drafts.**"))]{
  "slug": slug.current, templateNumber, fullName, businessName, email, phone, address, servingArea,
  "logoUrl": logo.asset->url, "photoUrl": photo.asset->url, published, createdAt
}`;
const res = await fetch(
  `https://${projectId}.api.sanity.io/v2025-10-01/data/query/${dataset}?query=${encodeURIComponent(query)}`,
  { headers: process.env.SANITY_API_WRITE_TOKEN ? { Authorization: `Bearer ${process.env.SANITY_API_WRITE_TOKEN}` } : {} },
);
if (!res.ok) throw new Error(`Sanity query failed: ${res.status}`);
const { result } = (await res.json()) as { result: SanitySite[] };

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const { data: form, error: formError } = await supabase.from("forms").select("id").eq("key", "onboarding").single();
if (formError) throw new Error(`Run the entries migration first: ${formError.message}`);

let imported = 0;
let skipped = 0;
for (const site of result) {
  if (!site.slug || !site.templateNumber || !site.logoUrl || !site.photoUrl) {
    console.log("Skipped an incomplete site.");
    skipped++;
    continue;
  }
  const { count, error: countError } = await supabase
    .from("entries")
    .select("id", { count: "exact", head: true })
    .eq("slug", site.slug)
    .neq("status", "rejected");
  if (countError) throw new Error(countError.message);
  if (count) {
    skipped++;
    continue;
  }
  const published = site.published === true;
  const now = new Date().toISOString();
  const { error } = await supabase.from("entries").insert({
    form_id: form.id,
    status: published ? "approved" : "suspended",
    slug: site.slug,
    template_number: site.templateNumber,
    full_name: site.fullName ?? "",
    business_name: site.businessName ?? "",
    email: site.email ?? "",
    phone: site.phone ?? "",
    address: site.address ?? "",
    serving_area: site.servingArea ?? "",
    logo_url: site.logoUrl,
    photo_url: site.photoUrl,
    published_at: published ? (site.createdAt ?? now) : null,
    reviewed_at: now,
    source: "sanity",
    created_at: site.createdAt ?? now,
  });
  if (error) throw new Error(`Could not import a site: ${error.message}`);
  imported++;
}
console.log(`Sanity sites found: ${result.length}. Imported: ${imported}. Skipped: ${skipped}.`);
