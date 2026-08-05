"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { RateLimitError, enforceRateLimit, ipRateLimitKey } from "@/lib/rateLimit";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  try {
    // Per-IP, not per-email — there's a single admin account, so this is purely brute-force
    // protection, not account-lockout risk for a real user.
    await enforceRateLimit(ipRateLimitKey("login"), 8, 5 * 60);
  } catch (error) {
    if (error instanceof RateLimitError) {
      redirect(`/admin/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
    }
    throw error;
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/admin/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  }

  redirect(next.startsWith("/admin") || next.startsWith("/checkin") ? next : "/admin");
}

export async function signOut() {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
