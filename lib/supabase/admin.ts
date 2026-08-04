import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseServiceRoleKey, supabaseUrl } from "./env";

/**
 * Service-role Supabase client — bypasses RLS entirely. This is the ONLY
 * client that reads/writes `guests`/`guest_views`. Import only from server
 * code (Server Components, Server Actions, Route Handlers). The `server-only`
 * import makes any accidental client-component import a build-time error.
 */
export function createSupabaseAdminClient() {
  return createClient(supabaseUrl(), supabaseServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
