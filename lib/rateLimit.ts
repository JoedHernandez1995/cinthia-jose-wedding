import "server-only";
import { headers } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export class RateLimitError extends Error {}

/**
 * Best-effort client IP for rate-limit keys. Vercel sets `x-forwarded-for` on every request;
 * falls back to a shared "unknown" bucket (still rate-limited, just coarsely) if it's ever
 * missing, e.g. local dev.
 */
function getClientIp(): string {
  const h = headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

/**
 * Enforces a fixed-window rate limit via the `check_rate_limit` Postgres function (see
 * `supabase/schema.sql`), which does the counting atomically so it's correct across every
 * serverless instance with no shared in-memory state. Throws `RateLimitError` when exceeded —
 * callers should catch it and surface a friendly message, same as `RsvpValidationError`.
 */
export async function enforceRateLimit(key: string, max: number, windowSeconds: number): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_key: key,
    p_max: max,
    p_window_seconds: windowSeconds,
  });
  if (error) throw error;
  if (!data) {
    throw new RateLimitError("Demasiados intentos. Espera unos minutos e intenta de nuevo.");
  }
}

/** Builds a rate-limit key scoped to the caller's IP and a named action. */
export function ipRateLimitKey(scope: string): string {
  return `${scope}:${getClientIp()}`;
}
