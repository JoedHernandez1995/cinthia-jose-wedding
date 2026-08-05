/**
 * Honduras is GMT-6 year-round (no DST) — every guest/admin-facing timestamp should render in
 * that zone regardless of the server's or browser's own timezone (Vercel's serverless functions
 * run in UTC), otherwise admins see check-in/RSVP times shifted by several hours.
 */
export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-HN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Tegucigalpa",
  });
}
