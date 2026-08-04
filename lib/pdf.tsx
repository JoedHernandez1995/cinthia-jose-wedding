import "server-only";
import path from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import "@/lib/pdfFonts";
import { coupleNames, wedding } from "@/config/site";
import { generateQrDataUri } from "@/lib/qr";
import { InvitationPdfDocument, type PdfPerson } from "@/components/pdf/InvitationPdfDocument";
import type { Guest } from "@/types/guest";

const monogramSrc = path.join(process.cwd(), "public", "assets", "monogram.png");

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
      monogramSrc={monogramSrc}
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
