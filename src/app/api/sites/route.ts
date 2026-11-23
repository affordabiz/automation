import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { parseOnboarding } from "@/forms/onboarding.schema";
import { sendEmail } from "@/lib/brevo";
import { siteReadyEmail } from "@/lib/emails/siteReady";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { createSite } from "@/lib/sanity/write";
import { TAKEN_MESSAGE } from "@/lib/slug";
import { checkSlug } from "@/lib/slugCheck";
import { siteUrl } from "@/lib/siteUrl";
import { verifyTurnstile } from "@/lib/turnstile";

const json = (body: unknown, status: number) => NextResponse.json(body, { status });

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

  try {
    const slugStatus = await checkSlug(data.slug);
    if (!slugStatus.available) {
      if (slugStatus.reason !== "taken") return json({ errors: { slug: [slugStatus.message] } }, 400);
      return json(
        { errors: { slug: [TAKEN_MESSAGE] }, ...(slugStatus.suggestion ? { suggestion: slugStatus.suggestion } : {}) },
        409,
      );
    }

    const result = await createSite(data, logo, photo);
    if (result === "conflict") return json({ errors: { slug: [TAKEN_MESSAGE] } }, 409);
  } catch (e) {
    console.error("[sites] create failed", e);
    return json({ error: "We couldn't create your webpage. Please try again." }, 500);
  }

  // Clear any cached 404 for this slug so the new page shows immediately.
  revalidateTag(`site:${data.slug}`, { expire: 0 });
  const url = siteUrl(data.slug);

  const email = await sendEmail({
    to: { email: data.email, name: data.fullName },
    ...siteReadyEmail({ fullName: data.fullName, businessName: data.businessName, url }),
  });
  if (!email.ok) console.error("[sites] site-ready email failed", data.slug, email.error);

  return json({ url }, 201);
}
