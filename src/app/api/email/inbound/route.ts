import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { parseInboundItem } from "@/lib/entries/inbound";
import { addEntryMessage } from "@/lib/entries/store";
import { serviceClient } from "@/lib/supabase/service";

function validSecret(provided: string | null, expected: string): boolean {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Brevo inbound parsing webhook. Replies are accepted only from the client on that entry. */
export async function POST(req: Request) {
  const secret = process.env.BREVO_INBOUND_SECRET;
  const domain = process.env.BREVO_INBOUND_DOMAIN?.trim();
  if (!secret || !domain) return NextResponse.json({ error: "Not configured" }, { status: 404 });
  if (!validSecret(new URL(req.url).searchParams.get("token"), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: { items?: unknown };
  try {
    payload = (await req.json()) as { items?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const items = Array.isArray(payload.items) ? payload.items.slice(0, 50) : [];
  let stored = 0;
  for (const item of items) {
    const reply = parseInboundItem(item, domain);
    if (!reply) continue;
    const { data: entry, error } = await serviceClient()
      .from("entries")
      .select("id,email,full_name")
      .eq("reply_token", reply.token)
      .maybeSingle<{ id: string; email: string; full_name: string }>();
    if (error) return NextResponse.json({ error: "Temporary failure" }, { status: 500 });
    if (!entry || entry.email.toLowerCase() !== reply.fromEmail) continue;
    try {
      await addEntryMessage({
        entryId: entry.id,
        direction: "inbound",
        body: reply.body,
        authorName: entry.full_name,
        providerMessageId: reply.messageId,
      });
      stored++;
    } catch (e) {
      console.error("[inbound] message not saved", entry.id, e);
      return NextResponse.json({ error: "Temporary failure" }, { status: 500 });
    }
  }
  return NextResponse.json({ stored });
}
