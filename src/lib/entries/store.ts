import "server-only";
import type { OnboardingData } from "@/forms/onboarding.schema";
import { serviceClient } from "@/lib/supabase/service";
import type { EntryStatus, LiveEntryRow } from "./mapping";

const PRIVATE_BUCKET = "entry-uploads";
const PUBLIC_BUCKET = "webpage-assets";
const SIGNED_URL_SECONDS = 60 * 60;

const EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

export interface Entry extends LiveEntryRow {
  form_id: string;
  status: EntryStatus;
  logo_path: string | null;
  photo_path: string | null;
  review_note: string | null;
  reviewed_by_email: string | null;
  reviewed_at: string | null;
  published_at: string | null;
  client_email_status: "sent" | "failed" | "not_sent" | null;
  source: "form" | "sanity";
  created_at: string;
  forms: { name: string };
}

const ENTRY_SELECT =
  "id,form_id,status,slug,template_number,full_name,business_name,email,phone,address,serving_area,logo_path,photo_path,logo_url,photo_url,review_note,reviewed_by_email,reviewed_at,published_at,client_email_status,source,created_at,forms!inner(name)";

export async function isSlugTaken(slug: string): Promise<boolean> {
  const { count, error } = await serviceClient()
    .from("entries")
    .select("id", { count: "exact", head: true })
    .eq("slug", slug)
    .neq("status", "rejected");
  if (error) throw new Error(`Could not check web address: ${error.message}`);
  return (count ?? 0) > 0;
}

async function uploadPrivate(entryId: string, name: "logo" | "photo", file: File): Promise<string> {
  const path = `${entryId}/${name}.${EXTENSIONS[file.type]}`;
  const { error } = await serviceClient()
    .storage.from(PRIVATE_BUCKET)
    .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type });
  if (error) throw new Error(`Could not upload ${name}: ${error.message}`);
  return path;
}

export async function createPendingEntry(input: OnboardingData, logo: File, photo: File): Promise<"created" | "conflict"> {
  const service = serviceClient();
  const { data: form, error: formError } = await service
    .from("forms")
    .select("id")
    .eq("key", "onboarding")
    .single<{ id: string }>();
  if (formError) throw new Error(`Could not load form: ${formError.message}`);

  const id = crypto.randomUUID();
  const uploaded: string[] = [];
  try {
    const logoPath = await uploadPrivate(id, "logo", logo);
    uploaded.push(logoPath);
    const photoPath = await uploadPrivate(id, "photo", photo);
    uploaded.push(photoPath);

    const { error } = await service.from("entries").insert({
      id,
      form_id: form.id,
      slug: input.slug,
      template_number: input.templateNumber,
      full_name: input.fullName,
      business_name: input.businessName,
      email: input.email,
      phone: input.phone,
      address: input.address,
      serving_area: input.servingArea,
      logo_path: logoPath,
      photo_path: photoPath,
    });
    if (error) {
      await service.storage.from(PRIVATE_BUCKET).remove(uploaded);
      if (error.code === "23505") return "conflict";
      throw new Error(`Could not save entry: ${error.message}`);
    }
    return "created";
  } catch (e) {
    if (uploaded.length > 0) await service.storage.from(PRIVATE_BUCKET).remove(uploaded);
    throw e;
  }
}

export async function getEntry(id: string): Promise<Entry | null> {
  const { data, error } = await serviceClient().from("entries").select(ENTRY_SELECT).eq("id", id).maybeSingle<Entry>();
  if (error) throw new Error(`Could not load entry: ${error.message}`);
  return data;
}

export async function listEntries(statuses: readonly EntryStatus[], limit = 200): Promise<Entry[]> {
  const { data, error } = await serviceClient()
    .from("entries")
    .select(ENTRY_SELECT)
    .in("status", [...statuses])
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<Entry[]>();
  if (error) throw new Error(`Could not load entries: ${error.message}`);
  return data;
}

export async function countEntries(status: EntryStatus): Promise<number> {
  const { count, error } = await serviceClient()
    .from("entries")
    .select("id", { count: "exact", head: true })
    .eq("status", status);
  if (error) throw new Error(`Could not count entries: ${error.message}`);
  return count ?? 0;
}

/** Live entries use public URLs. Unpublished entries get short-lived signed URLs for reviewers. */
export async function entryImages(entry: Entry): Promise<{ logoUrl: string; photoUrl: string } | null> {
  if (entry.logo_url && entry.photo_url) return { logoUrl: entry.logo_url, photoUrl: entry.photo_url };
  if (!entry.logo_path || !entry.photo_path) return null;
  const { data, error } = await serviceClient()
    .storage.from(PRIVATE_BUCKET)
    .createSignedUrls([entry.logo_path, entry.photo_path], SIGNED_URL_SECONDS);
  if (error || !data[0]?.signedUrl || !data[1]?.signedUrl) return null;
  return { logoUrl: data[0].signedUrl, photoUrl: data[1].signedUrl };
}

export interface PublishedAssets {
  logoUrl: string;
  photoUrl: string;
  paths: string[];
}

export async function publishEntryAssets(entry: Entry): Promise<PublishedAssets> {
  if (!entry.logo_path || !entry.photo_path) throw new Error("Entry has no uploaded images.");
  const storage = serviceClient().storage;
  const paths: string[] = [];
  for (const source of [entry.logo_path, entry.photo_path]) {
    const { data, error } = await storage.from(PRIVATE_BUCKET).download(source);
    if (error) throw new Error(`Could not read image: ${error.message}`);
    const { error: uploadError } = await storage
      .from(PUBLIC_BUCKET)
      .upload(source, data, { contentType: data.type, upsert: true, cacheControl: "31536000" });
    if (uploadError) throw new Error(`Could not publish image: ${uploadError.message}`);
    paths.push(source);
  }
  const url = (path: string) => storage.from(PUBLIC_BUCKET).getPublicUrl(path).data.publicUrl;
  return { logoUrl: url(paths[0]), photoUrl: url(paths[1]), paths };
}

export async function removePublishedAssets(paths: string[]): Promise<void> {
  if (paths.length > 0) await serviceClient().storage.from(PUBLIC_BUCKET).remove(paths);
}

export async function logContactMessage(entry: {
  siteId: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  emailStatus: "sent" | "failed";
}): Promise<void> {
  const { error } = await serviceClient().from("contact_messages").insert({
    entry_id: entry.siteId,
    name: entry.name,
    email: entry.email,
    phone: entry.phone,
    message: entry.message,
    email_status: entry.emailStatus,
  });
  if (error) throw new Error(`Could not log contact message: ${error.message}`);
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  email_status: "sent" | "failed";
  created_at: string;
}

export async function listContactMessages(entryId: string, limit = 50): Promise<ContactMessage[]> {
  const { data, error } = await serviceClient()
    .from("contact_messages")
    .select("id,name,email,phone,message,email_status,created_at")
    .eq("entry_id", entryId)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<ContactMessage[]>();
  if (error) throw new Error(`Could not load enquiries: ${error.message}`);
  return data;
}
