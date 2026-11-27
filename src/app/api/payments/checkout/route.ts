import { NextResponse } from "next/server";
import { z } from "zod";
import { isProductKey } from "@/lib/payments/products";
import { startCheckout } from "@/lib/payments/service";
import { isStripeConfigured } from "@/lib/payments/stripe";
import { clientIp, rateLimit } from "@/lib/rateLimit";

const emailSchema = z.email();

export async function POST(req: Request) {
  if (!rateLimit(`checkout:${clientIp(req.headers)}`, 15, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Payments aren't available right now. Please try again later." }, { status: 503 });
  }

  const body = (await req.json().catch(() => null)) as { product?: unknown; email?: unknown } | null;
  if (!isProductKey(body?.product)) return NextResponse.json({ error: "Choose a webpage option." }, { status: 400 });
  const rawEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const email = rawEmail && emailSchema.safeParse(rawEmail).success ? rawEmail : null;

  try {
    const url = await startCheckout(body.product, email);
    return NextResponse.json({ url });
  } catch (e) {
    console.error("[payments] checkout failed", e);
    return NextResponse.json({ error: "We couldn't open the payment page. Please try again." }, { status: 500 });
  }
}
