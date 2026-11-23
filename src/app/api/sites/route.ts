import { NextResponse } from "next/server";
import { parseOnboarding } from "@/forms/onboarding.schema";
import { entryReceivedEmail } from "@/lib/emails/entryStatus";
import { createPendingEntry, getAutoPublish, type Entry } from "@/lib/entries/store";
import { emailClient, publishEntry } from "@/lib/entries/workflow";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { siteUrl } from "@/lib/siteUrl";
import { TAKEN_MESSAGE } from "@/lib/slug";
import { checkSlug } from "@/lib/slugCheck";
import { verifyTurnstile } from "@/lib/turnstile";

const json = (body: unknown, status: number) => NextResponse.json(body, { status });

async function autoPublishEnabled(): Promise<boolean> {
  try {
    return await getAutoPublish();
  } catch (e) {
    // If the setting can't be read, keep the safe default of manual review.
    console.error("[sites] auto-publish setting unavailable", e);
    return false;
  }
}

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  if (!rateLimit(`sites:${ip}`, 5, 60 * 60 * 1000)) {
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

  const parsed = parseOnboarding(form);
  if (!parsed.success) return json({ errors: parsed.errors }, 400);
  const { data, logo, photo } = parsed;

  let entry: Entry;
  try {
    const slugStatus = await checkSlug(data.slug);
    if (!slugStatus.available) {
      if (slugStatus.reason !== "taken") return json({ errors: { slug: [slugStatus.message] } }, 400);
      return json(
        { errors: { slug: [TAKEN_MESSAGE] }, ...(slugStatus.suggestion ? { suggestion: slugStatus.suggestion } : {}) },
        409,
      );
    }

    const created = await createPendingEntry(data, logo, photo);
    if (created.result === "conflict") return json({ errors: { slug: [TAKEN_MESSAGE] } }, 409);
    entry = created.entry;
  } catch (e) {
    console.error("[sites] create failed", e);
    return json({ error: "We couldn't submit your request. Please try again." }, 500);
  }

  if (await autoPublishEnabled()) {
    const published = await publishEntry(entry, null);
    if (published.ok) return json({ status: "published", url: siteUrl(entry.slug) }, 201);
    console.error("[sites] auto-publish failed, left for review", entry.id, published.error);
  }

  await emailClient(
    entry,
    entryReceivedEmail({ fullName: data.fullName, businessName: data.businessName }),
    "We received your request. Our team will review your webpage and email you the link once it's approved.",
    { name: "Affordabiz" },
  );
  return json({ status: "pending" }, 201);
}
