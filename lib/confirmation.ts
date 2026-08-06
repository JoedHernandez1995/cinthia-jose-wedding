import "server-only";
import { buildInvitationPdf } from "@/lib/pdf";
import { sendRsvpConfirmationEmail } from "@/lib/email";
import { markConfirmationFailed, markConfirmationSent } from "@/lib/guests";
import type { Guest } from "@/types/guest";

/**
 * Emails the guest their RSVP outcome — with a check-in PDF attached when they're attending, or a
 * plain "we'll miss you" note when they're not — always with a link back to `/i/[token]#rsvp` to
 * change their mind before the deadline. Never throws — failures are recorded on the guest row and
 * reflected back as `false`, but the RSVP save that triggered this has already committed by the
 * time this runs and is never rolled back by a send failure here.
 */
export async function sendGuestConfirmation(guest: Guest): Promise<boolean> {
  if (!guest.email) return false;
  if (guest.rsvpStatus !== "yes" && guest.rsvpStatus !== "no") return false;

  try {
    const pdfBuffer = guest.rsvpStatus === "yes" ? await buildInvitationPdf(guest) : undefined;
    await sendRsvpConfirmationEmail({
      to: guest.email,
      guestName: guest.name,
      status: guest.rsvpStatus,
      primaryAttending: guest.primaryAttending,
      companionNames: guest.companionNames,
      token: guest.token,
      pdfBuffer,
    });
    await markConfirmationSent(guest.id);
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    await markConfirmationFailed(guest.id, message).catch(() => {});
    return false;
  }
}
