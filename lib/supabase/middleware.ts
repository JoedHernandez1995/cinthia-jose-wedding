import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "./env";

const PUBLIC_ADMIN_PATHS = ["/admin/login"];

/**
 * Refreshes the Supabase auth session on every request and gates `/admin/**` (except
 * `/admin/login`) and `/checkin/**` (door check-in via QR scan, staff-only) behind a valid
 * session, redirecting to login otherwise.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtectedRoute = path.startsWith("/admin") || path.startsWith("/checkin");
  const isPublicAdminPath = PUBLIC_ADMIN_PATHS.some((p) => path.startsWith(p));

  if (isProtectedRoute && !isPublicAdminPath && !user) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }

  // A phone's browser (or an intermediate CDN) will happily cache a GET response for an identical
  // URL — and every scan of the same QR code is an identical URL. Without this, a second scan of
  // an already-checked-in code can show the first scan's cached "success" page without the request
  // ever reaching the server to report "ya registrado".
  if (path.startsWith("/checkin")) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  }

  return response;
}
