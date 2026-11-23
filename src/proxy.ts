import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/set-password"];

function withAdminHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

/** Refreshes the session and redirects signed-out visitors. Real authorization happens on the server. */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!isSupabaseConfigured()) {
    if (isPublic) return withAdminHeaders(NextResponse.next({ request }));
    return withAdminHeaders(NextResponse.redirect(new URL("/admin/login", request.url)));
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Refreshes expiring sessions and verifies the token locally, with no auth round trip on each click.
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims.sub && !isPublic) {
    return withAdminHeaders(NextResponse.redirect(new URL("/admin/login", request.url)));
  }
  return withAdminHeaders(response);
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
