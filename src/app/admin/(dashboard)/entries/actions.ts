"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { ONBOARDING_FIELDS, type FieldDef } from "@/forms/onboarding.fields";
import { checkImage } from "@/forms/onboarding.schema";
import type { ActionState } from "@/lib/admin/actionState";
import { recordAudit } from "@/lib/admin/audit";
import { requirePermission } from "@/lib/admin/auth";
import { entryMessageEmail } from "@/lib/emails/entryStatus";
import {
  getEntry,
  isSlugTaken,
  markMessagesRead,
  removeStoredImages,
  setAutoPublish,
  uploadEntryImage,
  type Entry,
} from "@/lib/entries/store";
import { emailClient, publishEntry, type ClientEmailStatus } from "@/lib/entries/workflow";
import { assetUrl } from "@/lib/sanity/assetUrl";
import { isReservedSlug, isValidSlugFormat, RESERVED_MESSAGE, SLUG_FORMAT_MESSAGE, TAKEN_MESSAGE } from "@/lib/slug";
import { serviceClient } from "@/lib/supabase/service";
import { isLiveTemplate } from "@/templates/catalog";

const MAX_BULK = 100;
const STALE = "This entry was already updated. Refresh the page.";

const idsSchema = z.array(z.uuid()).min(1).max(MAX_BULK);

function refresh() {
  revalidatePath("/admin", "layout");
}

async function loadEntry(id: string): Promise<Entry | null> {
  return z.uuid().safeParse(id).success ? getEntry(id) : null;
}

function emailNote(status: ClientEmailStatus | null): string {
  if (status === "sent") return " The client was emailed.";
  if (status === "not_sent") return " Email dry-run is on, so the client was not emailed.";
  if (status === "failed") return " The client email failed.";
  return "";
}

function summary(verb: string, done: number, failed: number, firstError?: string): ActionState {
  const noun = done === 1 ? "entry" : "entries";
  if (failed === 0) return { message: `${done} ${noun} ${verb}.` };
  if (done === 0) return { error: firstError ?? `Couldn't update ${failed === 1 ? "this entry" : "these entries"}.` };
  return { error: `${done} ${noun} ${verb}. ${failed} failed: ${firstError ?? "try again."}` };
}

export async function setAutoPublishAction(enabled: boolean): Promise<ActionState> {
  const actor = await requirePermission("settings.manage");
  if (typeof enabled !== "boolean") return { error: "Invalid setting." };
  try {
    await setAutoPublish(enabled, actor.id);
  } catch (e) {
    console.error("[settings] auto-publish failed", e);
    return { error: "Couldn't save this setting." };
  }
  await recordAudit({ actor, action: "settings.auto_publish_changed", targetType: "setting", targetId: "auto_publish", details: { enabled } });
  refresh();
  return { message: enabled ? "Auto-publish is on. New entries go live immediately." : "Manual review is on." };
}

export async function publishEntriesAction(ids: string[]): Promise<ActionState> {
  const actor = await requirePermission("entries.review");
  const parsed = idsSchema.safeParse(ids);
  if (!parsed.success) return { error: "Select at least one entry." };

  let done = 0;
  let failed = 0;
  let firstError: string | undefined;
  let lastEmail: ClientEmailStatus | null = null;
  for (const id of parsed.data) {
    const entry = await getEntry(id);
    if (entry?.status === "approved") continue;
    const result = entry ? await publishEntry(entry, actor) : ({ ok: false, error: "Entry not found." } as const);
    if (result.ok) {
      done++;
      lastEmail = result.emailStatus ?? lastEmail;
    } else {
      failed++;
      firstError ??= result.error;
    }
  }
  refresh();
  const state = summary("published", done, failed, firstError);
  if (state.message && parsed.data.length === 1) return { message: `Published.${emailNote(lastEmail)}` };
  return state;
}

export async function draftEntriesAction(ids: string[]): Promise<ActionState> {
  const actor = await requirePermission("entries.review");
  const parsed = idsSchema.safeParse(ids);
  if (!parsed.success) return { error: "Select at least one entry." };

  let done = 0;
  let failed = 0;
  for (const id of parsed.data) {
    const entry = await getEntry(id);
    if (!entry) {
      failed++;
      continue;
    }
    if (entry.status === "draft") continue;
    const { data, error } = await serviceClient()
      .from("entries")
      .update({ status: "draft" })
      .eq("id", entry.id)
      .eq("status", entry.status)
      .select("id")
      .maybeSingle();
    if (error || !data) {
      failed++;
      continue;
    }
    if (entry.status === "approved") revalidateTag(`site:${entry.slug}`, { expire: 0 });
    await recordAudit({ actor, action: "entries.moved_to_draft", targetType: "entry", targetId: entry.id, details: { slug: entry.slug } });
    done++;
  }
  refresh();
  return summary("moved to Draft", done, failed);
}

export async function deleteEntriesAction(ids: string[]): Promise<ActionState> {
  const actor = await requirePermission("entries.delete");
  const parsed = idsSchema.safeParse(ids);
  if (!parsed.success) return { error: "Select at least one entry." };

  let done = 0;
  let failed = 0;
  for (const id of parsed.data) {
    const entry = await getEntry(id);
    if (!entry) continue;
    const { error } = await serviceClient().from("entries").delete().eq("id", entry.id);
    if (error) {
      console.error("[entries] delete failed", entry.id, error.message);
      failed++;
      continue;
    }
    await removeStoredImages([entry.logo_path, entry.photo_path]);
    revalidateTag(`site:${entry.slug}`, { expire: 0 });
    await recordAudit({
      actor,
      action: "entries.deleted",
      targetType: "entry",
      targetId: entry.id,
      details: { slug: entry.slug, business: entry.business_name, status: entry.status },
    });
    done++;
  }
  refresh();
  const result = summary("deleted", done, failed);
  if (result.message) result.message += done === 1 ? " Its web address is free to use again." : " Their web addresses are free to use again.";
  return result;
}

const editSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required.").max(100, "Full name is too long."),
  businessName: z.string().trim().min(1, "Business name is required.").max(120, "Business name is too long."),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.")),
  phone: z.string().trim().regex(/^[+()\d\s.-]{7,20}$/, "Enter a valid phone number."),
  address: z.string().trim().min(1, "Address is required.").max(200, "Address is too long."),
  servingArea: z.string().trim().min(1, "Serving area is required.").max(120, "Serving area is too long."),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .refine(isValidSlugFormat, SLUG_FORMAT_MESSAGE)
    .refine((s) => !isReservedSlug(s), RESERVED_MESSAGE),
  templateNumber: z.coerce.number().int().refine(isLiveTemplate, "Choose an available template."),
});

interface ImageChange {
  path: string | null;
  url: string | null;
  uploaded: string | null;
  replaced: string | null;
}

async function resolveImage(entry: Entry, name: "logo" | "photo", form: FormData): Promise<ImageChange | { error: string }> {
  const def: FieldDef = ONBOARDING_FIELDS.find((f) => f.name === name)!;
  const currentPath = name === "logo" ? entry.logo_path : entry.photo_path;
  const currentUrl = name === "logo" ? entry.logo_url : entry.photo_url;
  const isPublic = entry.status === "approved" || entry.status === "suspended";
  const file = form.get(name);

  if (file instanceof File && file.size > 0) {
    const problem = checkImage(def, file);
    if (problem) return { error: problem };
    const path = await uploadEntryImage(file);
    const url = isPublic ? assetUrl(path) : null;
    return { path, url, uploaded: path, replaced: currentPath };
  }
  if (form.get(`remove_${name}`) === "1") {
    if (isPublic) return { error: `This webpage needs a ${name}. Upload a new one or move it to Draft first.` };
    return { path: null, url: null, uploaded: null, replaced: currentPath };
  }
  return { path: currentPath, url: currentUrl, uploaded: null, replaced: null };
}

export async function updateEntryAction(id: string, _: ActionState, form: FormData): Promise<ActionState> {
  const actor = await requirePermission("entries.review");
  const entry = await loadEntry(id);
  if (!entry) return { error: "Entry not found." };

  const parsed = editSchema.safeParse({
    fullName: form.get("fullName"),
    businessName: form.get("businessName"),
    email: form.get("email"),
    phone: form.get("phone"),
    address: form.get("address"),
    servingArea: form.get("servingArea"),
    slug: form.get("slug"),
    templateNumber: form.get("templateNumber"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  const data = parsed.data;
  if (data.slug !== entry.slug && (await isSlugTaken(data.slug, entry.id))) return { error: TAKEN_MESSAGE };

  const uploaded: string[] = [];
  let logo: ImageChange;
  let photo: ImageChange;
  try {
    const logoResult = await resolveImage(entry, "logo", form);
    if ("error" in logoResult) return { error: logoResult.error };
    if (logoResult.uploaded) uploaded.push(logoResult.uploaded);
    const photoResult = await resolveImage(entry, "photo", form);
    if ("error" in photoResult) {
      await removeStoredImages(uploaded);
      return { error: photoResult.error };
    }
    if (photoResult.uploaded) uploaded.push(photoResult.uploaded);
    logo = logoResult;
    photo = photoResult;
  } catch (e) {
    console.error("[entries] image update failed", entry.id, e);
    await removeStoredImages(uploaded);
    return { error: "Couldn't upload the image. Nothing was changed." };
  }

  const { data: updated, error } = await serviceClient()
    .from("entries")
    .update({
      full_name: data.fullName,
      business_name: data.businessName,
      email: data.email,
      phone: data.phone,
      address: data.address,
      serving_area: data.servingArea,
      slug: data.slug,
      template_number: data.templateNumber,
      logo_path: logo.path,
      logo_url: logo.url,
      photo_path: photo.path,
      photo_url: photo.url,
    })
    .eq("id", entry.id)
    .eq("status", entry.status)
    .select("id")
    .maybeSingle();
  if (error || !updated) {
    await removeStoredImages(uploaded);
    if (error?.code === "23505") return { error: TAKEN_MESSAGE };
    if (error) console.error("[entries] update failed", entry.id, error.message);
    return { error: error ? "Couldn't save the changes." : STALE };
  }

  await removeStoredImages([logo.replaced, photo.replaced]);
  revalidateTag(`site:${entry.slug}`, { expire: 0 });
  if (data.slug !== entry.slug) revalidateTag(`site:${data.slug}`, { expire: 0 });
  await recordAudit({
    actor,
    action: "entries.edited",
    targetType: "entry",
    targetId: entry.id,
    details: { slug: data.slug, previousSlug: entry.slug === data.slug ? undefined : entry.slug },
  });

  if (form.get("intent") === "publish" && entry.status !== "approved") {
    const fresh = await getEntry(entry.id);
    const result = fresh ? await publishEntry(fresh, actor) : ({ ok: false, error: "Entry not found." } as const);
    refresh();
    if (!result.ok) return { error: `Saved, but not published: ${result.error}` };
    return { message: `Saved and published.${emailNote(result.emailStatus)}` };
  }
  refresh();
  return { message: "Changes saved." };
}

const messageSchema = z.string().trim().min(1, "Write a message first.").max(5000, "Keep messages under 5,000 characters.");

export async function sendEntryMessageAction(id: string, _: ActionState, form: FormData): Promise<ActionState> {
  const actor = await requirePermission("entries.review");
  const message = messageSchema.safeParse(form.get("message"));
  if (!message.success) return { error: message.error.issues[0]?.message ?? "Write a message first." };
  const entry = await loadEntry(id);
  if (!entry) return { error: "Entry not found." };

  const status = await emailClient(
    entry,
    entryMessageEmail({ fullName: entry.full_name, businessName: entry.business_name, message: message.data }),
    message.data,
    { id: actor.id, name: actor.fullName },
  );
  await recordAudit({ actor, action: "entries.message_sent", targetType: "entry", targetId: entry.id, details: { result: status } });
  refresh();
  if (status === "failed") return { error: "Saved to history, but the email failed to send.", saved: true };
  if (status === "not_sent") return { message: "Saved to history. Email dry-run is on, so it wasn't sent." };
  return { message: "Message sent." };
}

export async function markEntryReadAction(id: string): Promise<void> {
  await requirePermission("entries.view");
  if (!z.uuid().safeParse(id).success) return;
  await markMessagesRead(id);
  refresh();
}

export async function markAllNotificationsReadAction(): Promise<void> {
  await requirePermission("entries.view");
  await markMessagesRead();
  refresh();
}

async function setLiveState(id: string, from: "approved" | "suspended", to: "approved" | "suspended"): Promise<ActionState> {
  const actor = await requirePermission("webpages.manage");
  const entry = await loadEntry(id);
  if (!entry) return { error: "Webpage not found." };
  if (entry.status !== from) return { error: STALE };

  const { data, error } = await serviceClient()
    .from("entries")
    .update({ status: to })
    .eq("id", entry.id)
    .eq("status", from)
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("[webpages] status change failed", entry.id, error.message);
    return { error: "Couldn't update this webpage." };
  }
  if (!data) return { error: STALE };

  revalidateTag(`site:${entry.slug}`, { expire: 0 });
  await recordAudit({
    actor,
    action: to === "suspended" ? "webpages.suspended" : "webpages.restored",
    targetType: "entry",
    targetId: entry.id,
    details: { slug: entry.slug, business: entry.business_name },
  });
  refresh();
  return { message: to === "suspended" ? "The webpage is offline." : "The webpage is live again." };
}

export async function suspendWebpageAction(id: string): Promise<ActionState> {
  return setLiveState(id, "approved", "suspended");
}

export async function restoreWebpageAction(id: string): Promise<ActionState> {
  return setLiveState(id, "suspended", "approved");
}
