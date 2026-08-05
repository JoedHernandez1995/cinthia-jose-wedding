import { NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { getGuestByToken } from "@/lib/guests";
import { buildInvitationPdf } from "@/lib/pdf";
import { RateLimitError, enforceRateLimit, ipRateLimitKey } from "@/lib/rateLimit";

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
  try {
    // Rate-limited on both axes: per IP (broad abuse) and per token (a distributed attacker
    // hammering one specific guest's link from many IPs) — PDF+QR generation is real CPU work,
    // so this is the cheapest lever to close the DoS/cost-amplification path this route is.
    await enforceRateLimit(ipRateLimitKey("comprobante"), 10, 60);
    await enforceRateLimit(`comprobante:token:${params.token}`, 5, 60);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return new NextResponse(error.message, { status: 429 });
    }
    throw error;
  }

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
