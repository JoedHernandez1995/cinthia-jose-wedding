import "server-only";
import { buildInvitationPdf } from "@/lib/pdf";
import { sendRsvpConfirmationEmail } from "@/lib/email";
import { markConfirmationFailed, markConfirmationSent } from "@/lib/guests";
import type { Guest } from "@/types/guest";

/**
 * Builds the confirmation PDF and emails it. Never throws — failures are
 * recorded on the guest row and reflected back as `false`, but the RSVP save
 * that triggered this has already committed by the time this runs and is
 * never rolled back by a send failure here.
 */
export async function sendGuestConfirmation(guest: Guest): Promise<boolean> {
  if (!guest.email) return false;

  try {
    const pdfBuffer = await buildInvitationPdf(guest);
    await sendRsvpConfirmationEmail({ to: guest.email, guestName: guest.name, pdfBuffer });
    await markConfirmationSent(guest.id);
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    await markConfirmationFailed(guest.id, message).catch(() => {});
    return false;
  }
}
