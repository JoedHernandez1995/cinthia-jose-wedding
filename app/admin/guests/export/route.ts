import { NextResponse } from "next/server";
import { exportGuestsCsv } from "@/lib/guests";

export const dynamic = "force-dynamic";

export async function GET() {
  const csv = await exportGuestsCsv();
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="invitados-boda.csv"`,
    },
  });
}
