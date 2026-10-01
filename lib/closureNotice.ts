import "server-only";
import { sendRsvpClosureEmail } from "@/lib/email";
import { markClosureNoticeFailed, markClosureNoticeSent } from "@/lib/guests";
import { wedding } from "@/config/site";
import type { Guest } from "@/types/guest";

/**
 * Emails a guest who opened the invitation but never RSVP'd before the deadline, letting them
 * know the window closed and pointing them to the wedding planner if they still want to try to
 * attend. Unlike `sendGuestReminder` (lib/reminder.ts), this is a one-time, admin-triggered send —
 * not part of any automated campaign — so there's no cadence/due-date logic here, only eligibility.
 * Never throws — failures are recorded on the guest row and reflected back as `false`, mirroring
 * `sendGuestReminder`/`sendGuestConfirmation`'s never-block semantics.
 */
export async function sendGuestClosureNotice(guest: Guest): Promise<boolean> {
  if (!isClosureNoticeEligible(guest)) return false;

  try {
    await sendRsvpClosureEmail({
      to: guest.email as string,
      guestName: guest.displayName ?? guest.name,
    });
    await markClosureNoticeSent(guest.id);
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    await markClosureNoticeFailed(guest.id, message).catch(() => {});
    return false;
  }
}

/**
 * A guest qualifies once the RSVP window has actually closed, they never responded, they opened
 * the invitation at least once, and they have an email on file to send to. Shared between the
 * admin action (single-send) and the bulk queue's eligibility filter so both agree on the rule.
 */
export function isClosureNoticeEligible(guest: Guest): boolean {
  if (!guest.email) return false;
  if (guest.rsvpStatus !== "pending") return false;
  if (guest.viewCount <= 0) return false;
  return Date.now() > new Date(wedding.rsvpDeadlineIso).getTime();
}
