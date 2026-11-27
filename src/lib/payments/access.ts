import "server-only";
import { entryImages, getEntry, type Entry } from "@/lib/entries/store";
import { serviceClient } from "@/lib/supabase/service";
import { getPaymentByToken, type Payment } from "./store";

export type Access =
  | { state: "missing" }
  | { state: "invalid" }
  | { state: "unpaid"; payment: Payment }
  | { state: "revoked"; payment: Payment }
  | { state: "used"; payment: Payment; entry: Entry | null }
  | { state: "ok"; payment: Payment };

export async function resolveAccess(token: string | null | undefined): Promise<Access> {
  if (!token) return { state: "missing" };
  const payment = await getPaymentByToken(token);
  if (!payment) return { state: "invalid" };
  if (payment.status === "refunded" || payment.status === "disputed") return { state: "revoked", payment };
  if (payment.status !== "paid") return { state: "unpaid", payment };
  if (payment.used_at) return { state: "used", payment, entry: payment.entry_id ? await getEntry(payment.entry_id) : null };
  return { state: "ok", payment };
}

/** Webpages a paid client may replace: their own pages, matched by the email they paid with. */
const REPLACEABLE = ["approved", "suspended", "draft"] as const;

export interface OwnPage {
  id: string;
  slug: string;
  status: Entry["status"];
  templateNumber: number;
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  address: string;
  servingArea: string;
  logoUrl: string | null;
  photoUrl: string | null;
}

export async function ownEntries(email: string | null): Promise<Entry[]> {
  if (!email) return [];
  const { data, error } = await serviceClient()
    .from("entries")
    .select(
      "id,form_id,status,slug,template_number,full_name,business_name,email,phone,address,serving_area,logo_path,photo_path,logo_url,photo_url,published_at,source,reply_token,created_at",
    )
    .ilike("email", email.replace(/[\\%_]/g, (c) => `\\${c}`))
    .in("status", REPLACEABLE)
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) throw new Error(`Could not load webpages: ${error.message}`);
  // Live pages first, then the newest.
  return ((data ?? []) as Entry[]).sort((a, b) => Number(b.status === "approved") - Number(a.status === "approved"));
}

export async function ownPages(email: string | null): Promise<OwnPage[]> {
  const entries = await ownEntries(email);
  return Promise.all(
    entries.map(async (e) => {
      const images = await entryImages(e);
      return {
        id: e.id,
        slug: e.slug,
        status: e.status,
        templateNumber: e.template_number,
        fullName: e.full_name,
        businessName: e.business_name,
        email: e.email,
        phone: e.phone,
        address: e.address,
        servingArea: e.serving_area,
        logoUrl: images.logoUrl,
        photoUrl: images.photoUrl,
      };
    }),
  );
}
