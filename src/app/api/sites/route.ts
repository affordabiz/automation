import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { parseOnboarding } from "@/forms/onboarding.schema";
import { recordAudit } from "@/lib/admin/audit";
import { entryReceivedEmail } from "@/lib/emails/entryStatus";
import { createPendingEntry, type Entry, type ExistingImage } from "@/lib/entries/store";
import { emailClient, publishEntry } from "@/lib/entries/workflow";
import { ownEntries, resolveAccess } from "@/lib/payments/access";
import { alertReplaceFailure } from "@/lib/payments/service";
import { claimOnce, releaseClaim, updatePayment } from "@/lib/payments/store";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { siteUrl } from "@/lib/siteUrl";
import { TAKEN_MESSAGE } from "@/lib/slug";
import { checkSlug } from "@/lib/slugCheck";
import { serviceClient } from "@/lib/supabase/service";
import { verifyTurnstile } from "@/lib/turnstile";

const json = (body: unknown, status: number) => NextResponse.json(body, { status });

const ACCESS_ERRORS: Record<string, string> = {
  missing: "Please pay for your webpage first.",
  invalid: "This form link isn't valid. Use the link from your payment email.",
  unpaid: "Your payment hasn't gone through yet. Please complete the payment first.",
  revoked: "This payment was refunded or disputed, so this link no longer works.",
  used: "This payment has already been used to create a webpage.",
};

/** A temporary address while the old page still holds the one the client is keeping. */
const holdingSlug = () => `r-${crypto.randomUUID().replaceAll("-", "").slice(0, 24)}`;

function reuse(old: Entry, kind: "logo" | "photo"): ExistingImage {
  return kind === "logo" ? { path: old.logo_path, url: old.logo_url } : { path: old.photo_path, url: old.photo_url };
}

async function leaveForReview(entry: Entry, payment: Parameters<typeof alertReplaceFailure>[0], note: string) {
  await alertReplaceFailure({ ...payment, entry_id: entry.id }, note);
  await emailClient(
    entry,
    entryReceivedEmail({ fullName: entry.full_name, businessName: entry.business_name }),
    "We received your request. Our team will finish setting up your webpage and email you the link.",
    { name: "Affordabiz" },
  );
  return json({ status: "pending" }, 201);
}

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  if (!rateLimit(`sites:${ip}`, 10, 60 * 60 * 1000)) {
    return json({ error: "Too many submissions. Please try again later." }, 429);
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return json({ error: "Invalid form submission." }, 400);
  }

  if (String(form.get("company_website") ?? "") !== "") return json({ error: "Submission rejected." }, 403);
  if (!(await verifyTurnstile(String(form.get("cf-turnstile-response") ?? ""), ip))) {
    return json({ error: "Please complete the security check and try again." }, 403);
  }

  const access = await resolveAccess(String(form.get("access") ?? "")).catch((e) => {
    console.error("[sites] access check failed", e);
    return null;
  });
  if (!access) return json({ error: "We couldn't submit your request. Please try again." }, 500);
  if (access.state !== "ok") return json({ error: ACCESS_ERRORS[access.state] }, 403);
  const payment = access.payment;

  // The page being replaced must belong to the email this payment was made with.
  const replaceId = String(form.get("replaceId") ?? "");
  let old: Entry | null = null;
  if (replaceId) {
    try {
      old = (await ownEntries(payment.email)).find((e) => e.id === replaceId) ?? null;
    } catch (e) {
      console.error("[sites] own pages lookup failed", e);
      return json({ error: "We couldn't submit your request. Please try again." }, 500);
    }
    if (!old) return json({ error: "We couldn't find that webpage for your email address." }, 403);
  }
  if (payment.product === "renew" && !old) return json({ error: "Choose the webpage you're renewing." }, 400);
  // A renewal keeps last year's template.
  if (payment.product === "renew" && old) form.set("templateNumber", String(old.template_number));

  const parsed = parseOnboarding(form, { imagesOptional: Boolean(old) });
  if (!parsed.success) return json({ errors: parsed.errors }, 400);
  const { data } = parsed;
  const keepsAddress = old !== null && data.slug === old.slug;

  if (!keepsAddress) {
    try {
      const slugStatus = await checkSlug(data.slug);
      if (!slugStatus.available) {
        if (slugStatus.reason !== "taken") return json({ errors: { slug: [slugStatus.message] } }, 400);
        return json(
          { errors: { slug: [TAKEN_MESSAGE] }, ...(slugStatus.suggestion ? { suggestion: slugStatus.suggestion } : {}) },
          409,
        );
      }
    } catch (e) {
      console.error("[sites] slug check failed", e);
      return json({ error: "We couldn't submit your request. Please try again." }, 500);
    }
  }

  // One payment creates one webpage, even if the form is sent twice at once.
  if (!(await claimOnce(payment.id, "used_at"))) return json({ error: ACCESS_ERRORS.used }, 403);

  let entry: Entry;
  try {
    const logo = parsed.logo ?? (old ? reuse(old, "logo") : null);
    const photo = parsed.photo ?? (old ? reuse(old, "photo") : null);
    if (!logo || !photo) throw new Error("missing images");
    const created = await createPendingEntry(
      { ...data, slug: keepsAddress ? holdingSlug() : data.slug },
      logo,
      photo,
      undefined,
      { paymentId: payment.id },
    );
    if (created.result === "conflict") {
      await releaseClaim(payment.id, "used_at");
      return json({ errors: { slug: [TAKEN_MESSAGE] } }, 409);
    }
    entry = created.entry;
  } catch (e) {
    console.error("[sites] create failed", e);
    await releaseClaim(payment.id, "used_at");
    return json({ error: "We couldn't submit your request. Please try again." }, 500);
  }

  await updatePayment(payment.id, { entry_id: entry.id, previous_entry_id: old?.id ?? null }).catch((e) =>
    console.error("[sites] payment link not saved", payment.id, e),
  );

  if (old) {
    const { data: oldSlug, error } = await serviceClient().rpc("replace_entry", {
      p_old_id: old.id,
      p_new_id: entry.id,
      p_slug: data.slug,
    });
    if (error) {
      console.error("[sites] replace failed", old.id, entry.id, error.message);
      return leaveForReview(
        entry,
        payment,
        `A paid client submitted a new webpage, but the old page /${old.slug} couldn't be moved to draft. The new entry is waiting in Entries for review.`,
      );
    }
    revalidateTag(`site:${String(oldSlug)}`, { expire: 0 });
    entry = { ...entry, slug: data.slug };
    await recordAudit({
      actor: null,
      action: "entries.replaced",
      targetType: "entry",
      targetId: old.id,
      details: { slug: old.slug, newEntry: entry.id, payment: payment.id },
    });
  }

  // Paid webpages go live straight away.
  const published = await publishEntry(entry, null);
  if (published.ok) return json({ status: "published", url: siteUrl(entry.slug) }, 201);

  console.error("[sites] paid publish failed, left for review", entry.id, published.error);
  return leaveForReview(
    entry,
    payment,
    `A paid client's webpage /${entry.slug} couldn't be published automatically (${published.error}). It's waiting in Entries for review.`,
  );
}
