import "server-only";
import { sendRsvpReminderEmail } from "@/lib/email";
import { markReminderFailed, markReminderSent } from "@/lib/guests";
import type { Guest } from "@/types/guest";

/**
 * Emails a guest who opened the invitation but hasn't RSVP'd yet, with a link straight to
 * `/i/[token]#rsvp`. Never throws — failures are recorded on the guest row and reflected back as
 * `false`, mirroring `sendGuestConfirmation`'s never-block semantics.
 */
export async function sendGuestReminder(guest: Guest): Promise<boolean> {
  if (!guest.email) return false;
  if (guest.rsvpStatus !== "pending") return false;
  if (guest.viewCount <= 0) return false;

  try {
    await sendRsvpReminderEmail({
      to: guest.email,
      guestName: guest.displayName ?? guest.name,
      token: guest.token,
    });
    await markReminderSent(guest.id);
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    await markReminderFailed(guest.id, message).catch(() => {});
    return false;
  }
}
