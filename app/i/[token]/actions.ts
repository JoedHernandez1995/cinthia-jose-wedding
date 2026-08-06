"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { RsvpValidationError, getGuestByToken, recordGuestView, setGuestEmail, submitRsvp } from "@/lib/guests";
import { RateLimitError, enforceRateLimit, ipRateLimitKey } from "@/lib/rateLimit";
import type { SubmitRsvpInput } from "@/types/guest";

export type SubmitRsvpResult =
  | {
      ok: true;
      rsvpAttendingCount: number | null;
      primaryAttending: boolean | null;
      companionNames: string[];
      confirmationSent: boolean;
    }
  | { ok: false; error: string };

export async function submitRsvpAction(token: string, input: SubmitRsvpInput): Promise<SubmitRsvpResult> {
  try {
    // Per-IP, in addition to the per-token cooldown enforced inside `submitRsvp` itself — this
    // catches an attacker cycling through several leaked/guessed tokens from one IP, which the
    // per-token cooldown alone wouldn't.
    await enforceRateLimit(ipRateLimitKey("rsvp-submit"), 10, 60);
    const { guest, confirmationSent } = await submitRsvp(token, input);
    revalidatePath(`/i/${token}`);
    revalidatePath("/admin/guests");
    return {
      ok: true,
      rsvpAttendingCount: guest.rsvpAttendingCount,
      primaryAttending: guest.primaryAttending,
      companionNames: guest.companionNames,
      confirmationSent,
    };
  } catch (error) {
    if (error instanceof RsvpValidationError) {
      return { ok: false, error: error.message };
    }
    if (error instanceof RateLimitError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}

/**
 * Records a guest's invitation view — called once the guest actually clears the envelope gate
 * (from `EnvelopeIntro`'s open handler), not on page load. Loading `/i/[token]` doesn't imply the
 * guest has seen the invitation (link-preview bots, a forwarded link that was never opened, etc.);
 * opening the envelope is a real signal they did.
 */
export async function recordViewAction(token: string): Promise<void> {
  try {
    // Soft cap — just stops a scripted loop from inflating `view_count`; a real guest opening the
    // envelope happens at most a handful of times. Silently skips recording rather than surfacing
    // an error, since the caller (`EnvelopeIntro`) treats this as fire-and-forget.
    await enforceRateLimit(ipRateLimitKey("record-view"), 30, 60);
  } catch (error) {
    if (error instanceof RateLimitError) return;
    throw error;
  }

  const guest = await getGuestByToken(token);
  if (!guest) return;
  const userAgent = headers().get("user-agent");
  await recordGuestView(guest.id, userAgent);
}

export type SetGuestEmailResult = { ok: true } | { ok: false; error: string };

/** Envelope-gate action: a guest must have an email on file before they can open their invitation. */
export async function setGuestEmailAction(token: string, email: string): Promise<SetGuestEmailResult> {
  try {
    await enforceRateLimit(ipRateLimitKey("set-email"), 10, 60);
    await setGuestEmail(token, email);
    revalidatePath(`/i/${token}`);
    return { ok: true };
  } catch (error) {
    if (error instanceof RsvpValidationError) {
      return { ok: false, error: error.message };
    }
    if (error instanceof RateLimitError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}
