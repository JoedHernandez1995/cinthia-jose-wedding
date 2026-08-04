import { NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { getGuestById } from "@/lib/guests";
import { buildInvitationPdf } from "@/lib/pdf";

export const dynamic = "force-dynamic";

/** Admin-only manual verification tool — streams a freshly-built confirmation PDF for a guest. Not a check-in UI. */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const guest = await getGuestById(params.id);
  if (!guest) notFound();

  const pdfBuffer = await buildInvitationPdf(guest);
  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="confirmacion-${guest.name.replace(/\s+/g, "-").toLowerCase()}.pdf"`,
    },
  });
}
