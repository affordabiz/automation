import "server-only";
import type { OnboardingData } from "@/forms/onboarding.schema";
import { assetUrl, isSanityAssetId } from "@/lib/sanity/assetUrl";
import { deleteUnusedAssets, uploadImageAsset } from "@/lib/sanity/assets";
import { serviceClient } from "@/lib/supabase/service";
import type { EntryListItem, EntryMessage, EntryStatus, LiveEntryRow } from "./mapping";

const LIST_LIMIT = 500;

export interface Entry extends LiveEntryRow {
  form_id: string;
  status: EntryStatus;
  logo_path: string | null;
  photo_path: string | null;
  published_at: string | null;
  source: "form" | "sanity" | "wordpress";
  reply_token: string;
  created_at: string;
}

const ENTRY_COLUMNS =
  "id,form_id,status,slug,template_number,full_name,business_name,email,phone,address,serving_area,logo_path,photo_path,logo_url,photo_url,published_at,source,reply_token,created_at";
const LIST_COLUMNS = "id,status,slug,template_number,full_name,business_name,created_at";
const MESSAGE_COLUMNS = "id,entry_id,direction,body,author_name,email_status,read_at,created_at";

export async function isSlugTaken(slug: string, exceptId?: string): Promise<boolean> {
  let query = serviceClient().from("entries").select("id", { count: "exact", head: true }).eq("slug", slug);
  if (exceptId) query = query.neq("id", exceptId);
  const { count, error } = await query;
  if (error) throw new Error(`Could not check web address: ${error.message}`);
  return (count ?? 0) > 0;
}

export const uploadEntryImage = uploadImageAsset;

/** An image already stored for an earlier webpage, reused instead of a new upload. */
export interface ExistingImage {
  path: string | null;
  url: string | null;
}

export async function createPendingEntry(
  input: OnboardingData,
  logo: File | ExistingImage,
  photo: File | ExistingImage,
  formId?: string,
  options: { paymentId?: string } = {},
): Promise<{ result: "created"; entry: Entry } | { result: "conflict" }> {
  const service = serviceClient();
  let resolvedFormId = formId;
  if (!resolvedFormId) {
    const { data: form, error: formError } = await service
      .from("forms")
      .select("id")
      .eq("key", "onboarding")
      .single<{ id: string }>();
    if (formError) throw new Error(`Could not load form: ${formError.message}`);
    resolvedFormId = form.id;
  }

  const id = crypto.randomUUID();
  const uploaded: string[] = [];
  try {
    const store = async (image: File | ExistingImage): Promise<ExistingImage> => {
      if (!(image instanceof File)) return image;
      const path = await uploadEntryImage(image);
      uploaded.push(path);
      return { path, url: null };
    };
    const [logoImage, photoImage] = await Promise.all([store(logo), store(photo)]);
    const { data, error } = await service
      .from("entries")
      .insert({
        id,
        form_id: resolvedFormId,
        slug: input.slug,
        template_number: input.templateNumber,
        full_name: input.fullName,
        business_name: input.businessName,
        email: input.email,
        phone: input.phone,
        address: input.address,
        serving_area: input.servingArea,
        logo_path: logoImage.path,
        photo_path: photoImage.path,
        logo_url: logoImage.url,
        photo_url: photoImage.url,
        payment_id: options.paymentId ?? null,
      })
      .select(ENTRY_COLUMNS)
      .single<Entry>();
    if (error) {
      await deleteUnusedAssets(uploaded);
      if (error.code === "23505") return { result: "conflict" };
      throw new Error(`Could not save entry: ${error.message}`);
    }
    return { result: "created", entry: data };
  } catch (e) {
    await deleteUnusedAssets(uploaded);
    throw e;
  }
}

export async function getEntry(id: string): Promise<Entry | null> {
  const { data, error } = await serviceClient().from("entries").select(ENTRY_COLUMNS).eq("id", id).maybeSingle<Entry>();
  if (error) throw new Error(`Could not load entry: ${error.message}`);
  return data;
}

/** One lightweight query. The Entries page filters these rows in the browser, so tabs switch instantly. */
export async function listEntryRows(): Promise<EntryListItem[]> {
  const { data, error } = await serviceClient()
    .from("entries")
    .select(LIST_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT)
    .returns<EntryListItem[]>();
  if (error) throw new Error(`Could not load entries: ${error.message}`);
  return data;
}

export async function listEntries(statuses: readonly EntryStatus[], limit = 200): Promise<Entry[]> {
  const { data, error } = await serviceClient()
    .from("entries")
    .select(ENTRY_COLUMNS)
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

const imageUrl = (id: string | null) => (id && isSanityAssetId(id) ? assetUrl(id) : null);

export async function entryImages(entry: Entry): Promise<{ logoUrl: string | null; photoUrl: string | null }> {
  return { logoUrl: entry.logo_url ?? imageUrl(entry.logo_path), photoUrl: entry.photo_url ?? imageUrl(entry.photo_path) };
}

export const removeStoredImages = deleteUnusedAssets;

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

export async function listEntryMessages(entryId: string): Promise<EntryMessage[]> {
  const { data, error } = await serviceClient()
    .from("entry_messages")
    .select(MESSAGE_COLUMNS)
    .eq("entry_id", entryId)
    .order("created_at")
    .limit(500)
    .returns<EntryMessage[]>();
  if (error) throw new Error(`Could not load conversation: ${error.message}`);
  return data;
}

export async function addEntryMessage(message: {
  entryId: string;
  direction: "outbound" | "inbound";
  body: string;
  authorId?: string | null;
  authorName: string;
  emailStatus?: "sent" | "failed" | "not_sent" | null;
  providerMessageId?: string | null;
}): Promise<void> {
  const { error } = await serviceClient().from("entry_messages").insert({
    entry_id: message.entryId,
    direction: message.direction,
    body: message.body.slice(0, 10000),
    author_id: message.authorId ?? null,
    author_name: message.authorName,
    email_status: message.emailStatus ?? null,
    provider_message_id: message.providerMessageId ?? null,
  });
  // A repeated webhook delivery is already stored.
  if (error && error.code !== "23505") throw new Error(`Could not save message: ${error.message}`);
}

export async function countUnreadMessages(): Promise<number> {
  const { count, error } = await serviceClient()
    .from("entry_messages")
    .select("id", { count: "exact", head: true })
    .eq("direction", "inbound")
    .is("read_at", null);
  if (error) throw new Error(`Could not count notifications: ${error.message}`);
  return count ?? 0;
}

export async function markMessagesRead(entryId?: string): Promise<void> {
  let query = serviceClient()
    .from("entry_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("direction", "inbound")
    .is("read_at", null);
  if (entryId) query = query.eq("entry_id", entryId);
  const { error } = await query;
  if (error) throw new Error(`Could not update notifications: ${error.message}`);
}

export interface NotificationItem extends EntryMessage {
  entries: { business_name: string; full_name: string };
}

export async function listNotifications(limit = 100): Promise<NotificationItem[]> {
  const { data, error } = await serviceClient()
    .from("entry_messages")
    .select(`${MESSAGE_COLUMNS},entries!inner(business_name,full_name)`)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<NotificationItem[]>();
  if (error) throw new Error(`Could not load notifications: ${error.message}`);
  return data;
}

export async function getAutoPublish(): Promise<boolean> {
  const { data, error } = await serviceClient()
    .from("app_settings")
    .select("value")
    .eq("key", "auto_publish")
    .maybeSingle<{ value: unknown }>();
  if (error) throw new Error(`Could not load settings: ${error.message}`);
  return data?.value === true;
}

export async function setAutoPublish(enabled: boolean, userId: string): Promise<void> {
  const { error } = await serviceClient()
    .from("app_settings")
    .upsert({ key: "auto_publish", value: enabled, updated_by: userId });
  if (error) throw new Error(`Could not save setting: ${error.message}`);
}
