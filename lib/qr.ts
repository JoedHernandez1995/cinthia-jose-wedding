import "server-only";
import QRCode from "qrcode";

/**
 * Encodes a URL (not a bare code) so a future door-scanner feature can just
 * be "hit this URL, mark attended" with no code re-issuance, and a guest who
 * scans their own QR out of curiosity lands on a real page, not garbage text.
 * `/checkin/[code]` itself is intentionally not built yet.
 */
export function buildCheckinUrl(checkinCode: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${siteUrl}/checkin/${checkinCode}`;
}

/** PNG data URI for a check-in code, ready to drop into an `<Image>` (web or PDF). */
export async function generateQrDataUri(checkinCode: string): Promise<string> {
  return QRCode.toDataURL(buildCheckinUrl(checkinCode), { margin: 1, width: 240 });
}
