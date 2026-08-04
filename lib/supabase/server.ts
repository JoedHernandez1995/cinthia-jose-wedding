import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "./env";

/** Cookie-backed Supabase client for Server Components/Actions — carries the admin's auth session. */
export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component (not a Server Action/Route Handler) —
          // middleware already refreshes the session, so this is safe to ignore.
        }
      },
    },
  });
}
