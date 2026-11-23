import { NextResponse } from "next/server";
import { z } from "zod";
import { contactSchema } from "@/forms/contact.schema";
import { sendEmail } from "@/lib/brevo";
import { contactMessageEmail } from "@/lib/emails/contactMessage";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { getSiteBySlug } from "@/lib/entries/live";
import { logContactMessage } from "@/lib/entries/store";
import { siteUrl } from "@/lib/siteUrl";
import { verifyTurnstile } from "@/lib/turnstile";

const json = (body: unknown, status: number) => NextResponse.json(body, { status });

export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const ip = clientIp(req.headers);
  if (!rateLimit(`contact:${ip}`, 10, 60 * 60 * 1000)) {
    return json({ error: "Too many messages. Please try again later." }, 429);
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  if (typeof body.website === "string" && body.website !== "") return json({ error: "Message rejected." }, 403);
  if (!(await verifyTurnstile(typeof body.turnstileToken === "string" ? body.turnstileToken : "", ip))) {
    return json({ error: "Please complete the security check and try again." }, 403);
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) return json({ errors: z.flattenError(parsed.error).fieldErrors }, 400);

  const site = await getSiteBySlug(slug);
  if (!site || !site.id) return json({ error: "Page not found." }, 404);

  const msg = parsed.data;
  const result = await sendEmail({
    to: { email: site.email, name: site.fullName },
    replyTo: { email: msg.email, name: msg.name },
    ...contactMessageEmail({ businessName: site.businessName, ...msg, pageUrl: siteUrl(slug) }),
  });

  try {
    await logContactMessage({ siteId: site.id, ...msg, emailStatus: result.ok ? "sent" : "failed" });
  } catch (e) {
    console.error("[contact] log failed", e);
  }

  if (!result.ok) {
    console.error("[contact] email failed", slug, result.error);
    return json({ error: "Sorry, your message couldn't be sent. Please call or email instead." }, 502);
  }
  return json({ ok: true }, 200);
}
