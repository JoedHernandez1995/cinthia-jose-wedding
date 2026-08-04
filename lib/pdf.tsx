import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import { coupleNames, wedding } from "@/config/site";
import { generateQrDataUri } from "@/lib/qr";
import { InvitationPdfDocument, type PdfPerson } from "@/components/pdf/InvitationPdfDocument";
import type { Guest } from "@/types/guest";

/** Builds the confirmation PDF for a guest: event summary + one QR-coded entry per person (guest + each companion). */
export async function buildInvitationPdf(guest: Guest): Promise<Buffer> {
  const people: PdfPerson[] = await Promise.all(
    [
      { name: guest.name, checkinCode: guest.checkinCode },
      ...guest.companions.map((c) => ({ name: c.name, checkinCode: c.checkinCode })),
    ].map(async (person) => ({ ...person, qrDataUri: await generateQrDataUri(person.checkinCode) })),
  );

  return renderToBuffer(
    <InvitationPdfDocument
      coupleNames={coupleNames.full}
      dateLabel={wedding.dateLabel}
      timeLabel={wedding.timeLabel}
      venueName={wedding.venueName}
      venueAddress={wedding.venueAddress}
      dressCode={wedding.dressCode}
      people={people}
    />,
  );
}
