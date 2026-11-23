import { NextResponse, type NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { parseBody } from "next-sanity/webhook";

export async function POST(req: NextRequest) {
  const { isValidSignature, body } = await parseBody<{ _type?: string; slug?: string }>(
    req,
    process.env.SANITY_REVALIDATE_SECRET,
  );
  if (!isValidSignature) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  if (!body?._type) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  if (body._type === "site" && body.slug) revalidateTag(`site:${body.slug}`, { expire: 0 });
  if (body._type === "template") revalidateTag("templates", { expire: 0 });
  return NextResponse.json({ revalidated: true });
}
