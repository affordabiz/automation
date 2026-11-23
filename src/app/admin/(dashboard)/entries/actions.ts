"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@/lib/admin/actionState";
import { recordAudit } from "@/lib/admin/audit";
import { requirePermission } from "@/lib/admin/auth";
import { sendEmail, type EmailMessage } from "@/lib/brevo";
import { entryRejectedEmail } from "@/lib/emails/entryStatus";
import { siteReadyEmail } from "@/lib/emails/siteReady";
import { getEntry, publishEntryAssets, removePublishedAssets, type Entry } from "@/lib/entries/store";
import { siteUrl } from "@/lib/siteUrl";
import { serviceClient } from "@/lib/supabase/service";
import { isLiveTemplate } from "@/templates/catalog";

type ClientEmailStatus = "sent" | "failed" | "not_sent";

const ALREADY_REVIEWED = "This entry was already updated by someone else. Refresh the page.";
const reasonSchema = z.string().trim().min(3, "Enter a reason for the client.").max(1000, "Keep the reason under 1,000 characters.");

async function loadEntry(id: string): Promise<Entry | null> {
  return z.uuid().safeParse(id).success ? getEntry(id) : null;
}

function refresh(entry: Entry) {
  revalidatePath("/admin");
  revalidatePath("/admin/entries");
  revalidatePath(`/admin/entries/${entry.id}`);
  revalidatePath("/admin/webpages");
}

async function emailClient(entry: Entry, content: Omit<EmailMessage, "to">): Promise<ClientEmailStatus> {
  const result = await sendEmail({ to: { email: entry.email, name: entry.full_name }, ...content });
  if (!result.ok) console.error("[entries] client email failed", entry.id, result.error);
  const status: ClientEmailStatus = !result.ok ? "failed" : result.messageId === "dry-run" ? "not_sent" : "sent";
  const { error } = await serviceClient().from("entries").update({ client_email_status: status }).eq("id", entry.id);
  if (error) console.error("[entries] email status not saved", entry.id, error.message);
  return status;
}

function outcome(done: string, status: ClientEmailStatus): ActionState {
  if (status === "sent") return { message: `${done} The client was emailed.` };
  if (status === "not_sent") return { message: `${done} Email dry-run is on, so the client was not emailed.` };
  return { error: `${done} The client email failed.` };
}

const liveEmail = (entry: Entry) =>
  siteReadyEmail({ fullName: entry.full_name, businessName: entry.business_name, url: siteUrl(entry.slug) });

export async function approveEntryAction(id: string): Promise<ActionState> {
  const actor = await requirePermission("entries.review");
  const entry = await loadEntry(id);
  if (!entry) return { error: "Entry not found." };
  if (entry.status !== "pending") return { error: ALREADY_REVIEWED };
  if (!isLiveTemplate(entry.template_number)) return { error: "This entry's template isn't available yet." };

  let assets;
  try {
    assets = await publishEntryAssets(entry);
  } catch (e) {
    console.error("[entries] publishing images failed", entry.id, e);
    return { error: "Couldn't publish the images. Nothing went live." };
  }

  const now = new Date().toISOString();
  const { data, error } = await serviceClient()
    .from("entries")
    .update({
      status: "approved",
      logo_url: assets.logoUrl,
      photo_url: assets.photoUrl,
      reviewed_by: actor.id,
      reviewed_by_email: actor.email,
      reviewed_at: now,
      published_at: now,
      review_note: null,
    })
    .eq("id", entry.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("[entries] approve failed", entry.id, error.message);
    const current = await getEntry(entry.id).catch(() => null);
    if (current?.status === "pending") await removePublishedAssets(assets.paths);
    return { error: "Couldn't approve this entry. Nothing went live." };
  }
  if (!data) return { error: ALREADY_REVIEWED };

  revalidateTag(`site:${entry.slug}`, { expire: 0 });
  await recordAudit({
    actor,
    action: "entries.approved",
    targetType: "entry",
    targetId: entry.id,
    details: { slug: entry.slug, business: entry.business_name },
  });
  const status = await emailClient(entry, liveEmail(entry));
  refresh(entry);
  return outcome("The webpage is live.", status);
}

export async function rejectEntryAction(id: string, _: ActionState, form: FormData): Promise<ActionState> {
  const actor = await requirePermission("entries.review");
  const reason = reasonSchema.safeParse(form.get("reason"));
  if (!reason.success) return { error: reason.error.issues[0]?.message ?? "Enter a reason." };
  const entry = await loadEntry(id);
  if (!entry) return { error: "Entry not found." };
  if (entry.status !== "pending") return { error: ALREADY_REVIEWED };

  const { data, error } = await serviceClient()
    .from("entries")
    .update({
      status: "rejected",
      review_note: reason.data,
      reviewed_by: actor.id,
      reviewed_by_email: actor.email,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", entry.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("[entries] reject failed", entry.id, error.message);
    return { error: "Couldn't reject this entry." };
  }
  if (!data) return { error: ALREADY_REVIEWED };

  await recordAudit({
    actor,
    action: "entries.rejected",
    targetType: "entry",
    targetId: entry.id,
    details: { slug: entry.slug, business: entry.business_name, reason: reason.data },
  });
  const status = await emailClient(
    entry,
    entryRejectedEmail({ fullName: entry.full_name, businessName: entry.business_name, reason: reason.data }),
  );
  refresh(entry);
  return outcome("The entry was rejected and its web address is available again.", status);
}

export async function resendClientEmailAction(id: string): Promise<ActionState> {
  const actor = await requirePermission("entries.review");
  const entry = await loadEntry(id);
  if (!entry) return { error: "Entry not found." };

  let content;
  if (entry.status === "approved") content = liveEmail(entry);
  else if (entry.status === "rejected" && entry.review_note) {
    content = entryRejectedEmail({ fullName: entry.full_name, businessName: entry.business_name, reason: entry.review_note });
  } else return { error: "There's no client email to resend for this entry." };

  const status = await emailClient(entry, content);
  await recordAudit({
    actor,
    action: "entries.client_email_resent",
    targetType: "entry",
    targetId: entry.id,
    details: { slug: entry.slug, result: status },
  });
  refresh(entry);
  return outcome("Resend finished.", status);
}

async function setLiveState(id: string, from: "approved" | "suspended", to: "approved" | "suspended"): Promise<ActionState> {
  const actor = await requirePermission("webpages.manage");
  const entry = await loadEntry(id);
  if (!entry) return { error: "Webpage not found." };
  if (entry.status !== from) return { error: ALREADY_REVIEWED };

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
  if (!data) return { error: ALREADY_REVIEWED };

  revalidateTag(`site:${entry.slug}`, { expire: 0 });
  await recordAudit({
    actor,
    action: to === "suspended" ? "webpages.suspended" : "webpages.restored",
    targetType: "entry",
    targetId: entry.id,
    details: { slug: entry.slug, business: entry.business_name },
  });
  refresh(entry);
  return { message: to === "suspended" ? "The webpage is offline." : "The webpage is live again." };
}

export async function suspendWebpageAction(id: string): Promise<ActionState> {
  return setLiveState(id, "approved", "suspended");
}

export async function restoreWebpageAction(id: string): Promise<ActionState> {
  return setLiveState(id, "suspended", "approved");
}
