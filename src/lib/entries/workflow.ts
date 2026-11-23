import "server-only";
import { revalidateTag } from "next/cache";
import { recordAudit } from "@/lib/admin/audit";
import { sendEmail } from "@/lib/brevo";
import type { EmailContent } from "@/lib/emails/layout";
import { siteReadyEmail } from "@/lib/emails/siteReady";
import { siteUrl } from "@/lib/siteUrl";
import { serviceClient } from "@/lib/supabase/service";
import { isLiveTemplate } from "@/templates/catalog";
import { addEntryMessage, publishImage, type Entry } from "./store";

export type ClientEmailStatus = "sent" | "failed" | "not_sent";
export interface Actor {
  id: string;
  email: string;
  fullName?: string;
}

const inboundDomain = () => process.env.BREVO_INBOUND_DOMAIN?.trim().toLowerCase() || null;

/** Client replies reach the dashboard only when a Brevo inbound domain is configured. */
export function replyAddress(entry: Pick<Entry, "reply_token">): string | null {
  const domain = inboundDomain();
  return domain ? `reply+${entry.reply_token}@${domain}` : null;
}

export async function emailClient(
  entry: Entry,
  content: EmailContent,
  historyBody: string,
  author: { id?: string | null; name: string },
): Promise<ClientEmailStatus> {
  const replyTo = replyAddress(entry);
  const result = await sendEmail({
    to: { email: entry.email, name: entry.full_name },
    ...(replyTo ? { replyTo: { email: replyTo, name: "Affordabiz" } } : {}),
    ...content,
  });
  if (!result.ok) console.error("[entries] client email failed", entry.id, result.error);
  const status: ClientEmailStatus = !result.ok ? "failed" : result.messageId === "dry-run" ? "not_sent" : "sent";
  try {
    await addEntryMessage({
      entryId: entry.id,
      direction: "outbound",
      body: historyBody,
      authorId: author.id,
      authorName: author.name,
      emailStatus: status,
    });
  } catch (e) {
    console.error("[entries] message history not saved", entry.id, e);
  }
  return status;
}

export type PublishResult =
  | { ok: true; emailStatus: ClientEmailStatus | null }
  | { ok: false; error: string };

/** Makes an entry live. The client link email is sent only the first time a page is published. */
export async function publishEntry(entry: Entry, actor: Actor | null): Promise<PublishResult> {
  if (entry.status === "approved") return { ok: false, error: "This webpage is already active." };
  if (!isLiveTemplate(entry.template_number)) return { ok: false, error: "This entry's template isn't available yet." };
  if (!(entry.logo_url || entry.logo_path)) return { ok: false, error: "Add a logo before publishing." };
  if (!(entry.photo_url || entry.photo_path)) return { ok: false, error: "Add a photo before publishing." };

  let logoUrl = entry.logo_url;
  let photoUrl = entry.photo_url;
  try {
    [logoUrl, photoUrl] = await Promise.all([
      logoUrl ?? publishImage(entry.logo_path!),
      photoUrl ?? publishImage(entry.photo_path!),
    ]);
  } catch (e) {
    console.error("[entries] publishing images failed", entry.id, e);
    return { ok: false, error: "Couldn't publish the images. Nothing went live." };
  }

  const now = new Date().toISOString();
  const firstPublish = !entry.published_at;
  const { data, error } = await serviceClient()
    .from("entries")
    .update({
      status: "approved",
      logo_url: logoUrl,
      photo_url: photoUrl,
      reviewed_by: actor?.id ?? null,
      reviewed_by_email: actor?.email ?? "Auto-publish",
      reviewed_at: now,
      published_at: entry.published_at ?? now,
    })
    .eq("id", entry.id)
    .eq("status", entry.status)
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("[entries] publish failed", entry.id, error.message);
    return { ok: false, error: "Couldn't publish this entry." };
  }
  if (!data) return { ok: false, error: "This entry was already updated. Refresh the page." };

  revalidateTag(`site:${entry.slug}`, { expire: 0 });
  await recordAudit({
    actor,
    action: actor ? "entries.published" : "entries.auto_published",
    targetType: "entry",
    targetId: entry.id,
    details: { slug: entry.slug, business: entry.business_name },
  });

  if (!firstPublish) return { ok: true, emailStatus: null };
  const url = siteUrl(entry.slug);
  const emailStatus = await emailClient(
    entry,
    siteReadyEmail({ fullName: entry.full_name, businessName: entry.business_name, url }),
    `Your webpage is live: ${url}`,
    { id: actor?.id, name: actor?.fullName ?? "Affordabiz" },
  );
  return { ok: true, emailStatus };
}
