"use server";

import { revalidatePath } from "next/cache";
import { RsvpValidationError, submitRsvp } from "@/lib/guests";
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
