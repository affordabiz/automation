/**
 * Copies existing Supabase Storage uploads into Sanity and updates their database records.
 * Safe to re-run: records already using Sanity are skipped. Supabase files are not deleted.
 */
import { createClient as createSanity } from "next-sanity";
import { createClient } from "@supabase/supabase-js";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_WRITE_TOKEN;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!projectId || !token || !url || !key) throw new Error("Sanity and Supabase environment variables are required.");

const sanity = createSanity({ projectId, dataset, token, apiVersion: "2025-10-01", useCdn: false, perspective: "raw" });
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const isSanityId = (id: string) => /^(image|file)-[a-f0-9]+-/.test(id);

async function copy(bucket: string, path: string, kind: "image" | "file", filename: string) {
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error) throw new Error(`Could not read ${bucket} file: ${error.message}`);
  const asset = await sanity.assets.upload(kind as "image", Buffer.from(await data.arrayBuffer()), { filename, contentType: data.type });
  return { id: asset._id, url: asset.url };
}

interface EntryRow {
  id: string;
  logo_path: string | null;
  photo_path: string | null;
  logo_url: string | null;
  photo_url: string | null;
}

const { data: entries, error: entriesError } = await supabase
  .from("entries")
  .select("id,logo_path,photo_path,logo_url,photo_url")
  .returns<EntryRow[]>();
if (entriesError) throw new Error(entriesError.message);

let movedEntries = 0;
for (const entry of entries) {
  const patch: Partial<EntryRow> = {};
  for (const name of ["logo", "photo"] as const) {
    const path = entry[`${name}_path`];
    if (!path || isSanityId(path)) continue;
    const asset = await copy("entry-uploads", path, "image", path.split("/").pop() ?? name);
    patch[`${name}_path`] = asset.id;
    if (entry[`${name}_url`]) patch[`${name}_url`] = asset.url;
  }
  if (Object.keys(patch).length === 0) continue;
  const { error } = await supabase.from("entries").update(patch).eq("id", entry.id);
  if (error) throw new Error(`Could not update an entry: ${error.message}`);
  movedEntries++;
}

interface Answer {
  files?: { name: string; path: string }[];
}

const { data: submissions, error: submissionsError } = await supabase
  .from("form_submissions")
  .select("id,answers")
  .returns<{ id: string; answers: Answer[] }[]>();
if (submissionsError) throw new Error(submissionsError.message);

let movedSubmissions = 0;
for (const submission of submissions) {
  let changed = false;
  for (const answer of submission.answers) {
    for (const file of answer.files ?? []) {
      if (isSanityId(file.path)) continue;
      file.path = (await copy("form-uploads", file.path, "file", file.name)).id;
      changed = true;
    }
  }
  if (!changed) continue;
  const { error } = await supabase.from("form_submissions").update({ answers: submission.answers }).eq("id", submission.id);
  if (error) throw new Error(`Could not update a response: ${error.message}`);
  movedSubmissions++;
}

console.log(`Entries moved: ${movedEntries}. Responses moved: ${movedSubmissions}.`);
