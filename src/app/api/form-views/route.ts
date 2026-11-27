import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { isValidSlugFormat } from "@/lib/slug";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { serviceClient } from "@/lib/supabase/service";

/** Built-in onboarding form (/create) is addressed by its key rather than its slug. */
const ONBOARDING_VIEW_KEY = "__onboarding__";

const empty = () => new NextResponse(null, { status: 204 });

/** Counts one public view of a published form. Browsers send it once per session. */
export async function POST(req: Request) {
  if (!isSupabaseConfigured()) return empty();
  if (!rateLimit(`form-view:${clientIp(req.headers)}`, 30, 60_000)) return empty();

  const body = (await req.json().catch(() => null)) as { slug?: unknown } | null;
  const slug = typeof body?.slug === "string" ? body.slug : "";
  const service = serviceClient();
  const lookup =
    slug === ONBOARDING_VIEW_KEY
      ? service.from("forms").select("id").eq("key", "onboarding")
      : isValidSlugFormat(slug)
        ? service.from("forms").select("id").eq("slug", slug).eq("status", "published")
        : null;
  if (!lookup) return empty();

  const { data: form } = await lookup.maybeSingle<{ id: string }>();
  if (!form) return empty();
  const { error } = await service.rpc("increment_form_view", { p_form_id: form.id });
  if (error) console.error("[forms] view count failed", error.message);
  return empty();
}
