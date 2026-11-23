import { NextResponse } from "next/server";
import { checkSlug } from "@/lib/slugCheck";
import { clientIp, rateLimit } from "@/lib/rateLimit";

export async function GET(req: Request) {
  if (!rateLimit(`slug:${clientIp(req.headers)}`, 60, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  return NextResponse.json(await checkSlug(slug), { headers: { "cache-control": "no-store" } });
}
