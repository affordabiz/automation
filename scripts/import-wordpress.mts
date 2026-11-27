/**
 * Copies client webpages from the old WordPress site into Supabase.
 *
 * Usage: pnpm admin:import-wordpress <records.json> [--dry-run]
 *
 * Each record holds the details read from one WordPress page (see the migration notes).
 * Logos and photos are downloaded from WordPress media and uploaded to Sanity, so the pages
 * keep working after WordPress moves to another domain.
 * Safe to re-run: web addresses that already exist in Supabase are skipped. WordPress is only read.
 */
import { readFile } from "node:fs/promises";
import { createClient as createSanity } from "next-sanity";
import { createClient } from "@supabase/supabase-js";

interface WordpressRecord {
  wp_id: number;
  slug: string;
  status_new: "approved" | "draft";
  modified: string;
  template: number;
  full_name: string;
  business_name: string;
  email: string;
  phone: string;
  address: string;
  serving_area: string;
  logo: string | null;
  photo: string | null;
  text_logo?: boolean;
}

const [file, ...flags] = process.argv.slice(2);
const dryRun = flags.includes("--dry-run");
if (!file) throw new Error("Pass the path to the records JSON file.");

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_WRITE_TOKEN;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!projectId || !token || !url || !key) throw new Error("Sanity and Supabase environment variables are required.");

const sanity = createSanity({ projectId, dataset, token, apiVersion: "2025-10-01", useCdn: false, perspective: "raw" });
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const records = JSON.parse(await readFile(file, "utf8")) as WordpressRecord[];
const { data: form, error: formError } = await supabase.from("forms").select("id").eq("key", "onboarding").single();
if (formError) throw new Error(`Could not find the onboarding form: ${formError.message}`);

const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** A simple wordmark for clients who never sent a logo. */
function textLogo(name: string): Buffer {
  const text = escapeXml(name.trim() || "Tax Services");
  const width = Math.max(240, Math.round(text.length * 19 + 40));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="80" viewBox="0 0 ${width} 80"><text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" font-family="Montserrat, Arial, Helvetica, sans-serif" font-size="32" font-weight="700" fill="#1f2937">${text}</text></svg>`;
  return Buffer.from(svg, "utf8");
}

async function upload(buffer: Buffer, filename: string, contentType: string) {
  const asset = await sanity.assets.upload("image", buffer, { filename, contentType });
  return { path: asset._id, url: asset.url };
}

async function copyImage(src: string) {
  const res = await fetch(src);
  if (!res.ok) throw new Error(`Could not download ${src}: ${res.status}`);
  const contentType = res.headers.get("content-type")?.split(";")[0] ?? "image/jpeg";
  if (!contentType.startsWith("image/")) throw new Error(`${src} is not an image (${contentType})`);
  const filename = decodeURIComponent(new URL(src).pathname.split("/").pop() ?? "image");
  return upload(Buffer.from(await res.arrayBuffer()), filename, contentType);
}

let imported = 0;
let skipped = 0;
const failed: string[] = [];
for (const r of records) {
  const { count, error: countError } = await supabase
    .from("entries")
    .select("id", { count: "exact", head: true })
    .eq("slug", r.slug);
  if (countError) throw new Error(countError.message);
  if (count) {
    console.log(`skip   /${r.slug} (already exists)`);
    skipped++;
    continue;
  }
  if (dryRun) {
    console.log(`would  /${r.slug} T${r.template} ${r.status_new} logo:${r.logo ? "yes" : r.text_logo ? "text" : "no"} photo:${r.photo ? "yes" : "no"}`);
    imported++;
    continue;
  }
  try {
    const logo = r.logo
      ? await copyImage(r.logo)
      : r.text_logo
        ? await upload(textLogo(r.business_name), `${r.slug}-logo.svg`, "image/svg+xml")
        : null;
    const photo = r.photo ? await copyImage(r.photo) : null;
    const live = r.status_new === "approved";
    const when = new Date(r.modified).toISOString();
    const { error } = await supabase.from("entries").insert({
      form_id: form.id,
      status: r.status_new,
      slug: r.slug,
      template_number: r.template,
      full_name: r.full_name,
      business_name: r.business_name,
      email: r.email.toLowerCase(),
      phone: r.phone,
      address: r.address,
      serving_area: r.serving_area,
      logo_path: logo?.path ?? null,
      logo_url: logo?.url ?? null,
      photo_path: photo?.path ?? null,
      photo_url: photo?.url ?? null,
      published_at: live ? when : null,
      reviewed_at: new Date().toISOString(),
      source: "wordpress",
      created_at: when,
    });
    if (error) throw new Error(error.message);
    console.log(`ok     /${r.slug} T${r.template} ${r.status_new}`);
    imported++;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(`FAILED /${r.slug}: ${message}`);
    failed.push(`${r.slug}: ${message}`);
  }
}
console.log(`\nRecords: ${records.length}. ${dryRun ? "Would import" : "Imported"}: ${imported}. Skipped: ${skipped}. Failed: ${failed.length}.`);
if (failed.length) process.exitCode = 1;
