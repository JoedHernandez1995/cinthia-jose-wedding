"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { RsvpValidationError, getGuestByToken, recordGuestView, setGuestEmail, submitRsvp } from "@/lib/guests";
import type { SubmitRsvpInput } from "@/types/guest";

export type SubmitRsvpResult =
  | { ok: true; rsvpAttendingCount: number | null; companionNames: string[]; confirmationSent: boolean }
  | { ok: false; error: string };

export async function submitRsvpAction(token: string, input: SubmitRsvpInput): Promise<SubmitRsvpResult> {
  try {
    const { guest, confirmationSent } = await submitRsvp(token, input);
    revalidatePath(`/i/${token}`);
    revalidatePath("/admin/guests");
    return {
      ok: true,
      rsvpAttendingCount: guest.rsvpAttendingCount,
      companionNames: guest.companionNames,
      confirmationSent,
    };
  } catch (error) {
    if (error instanceof RsvpValidationError) {
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
  const guest = await getGuestByToken(token);
  if (!guest) return;
  const userAgent = headers().get("user-agent");
  await recordGuestView(guest.id, userAgent);
}

export type SetGuestEmailResult = { ok: true } | { ok: false; error: string };

/** Envelope-gate action: a guest must have an email on file before they can open their invitation. */
export async function setGuestEmailAction(token: string, email: string): Promise<SetGuestEmailResult> {
  try {
    await setGuestEmail(token, email);
    revalidatePath(`/i/${token}`);
    return { ok: true };
  } catch (error) {
    if (error instanceof RsvpValidationError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}
