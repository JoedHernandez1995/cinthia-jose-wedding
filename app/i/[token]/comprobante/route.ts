import { NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { getGuestByToken } from "@/lib/guests";
import { buildInvitationPdf } from "@/lib/pdf";

// Always hit the database — a guest's RSVP state (and thus their QR codes) can change at any time.
export const dynamic = "force-dynamic";

/**
 * Guest-facing re-download of their own confirmation PDF (event summary + check-in QR codes),
 * gated only by knowledge of the token — same trust model as the rest of `/i/[token]`. Exists so
 * the admin can resend a lost QR code over WhatsApp without an email round trip: the `wa.me` link
 * built by `buildGuestConfirmationResendLink`/`buildCompanionConfirmationResendLink` just points
 * here. Rebuilt fresh from live data on every request — never cached or persisted anywhere.
 */
export async function GET(_request: Request, { params }: { params: { token: string } }) {
  const guest = await getGuestByToken(params.token);
  if (!guest || guest.rsvpStatus !== "yes") notFound();

  const pdfBuffer = await buildInvitationPdf(guest);
  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="confirmacion-${guest.name.replace(/\s+/g, "-").toLowerCase()}.pdf"`,
    },
  });
}
