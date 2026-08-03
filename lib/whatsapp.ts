/** Builds a `wa.me` deep link, optionally pre-filling the message text. */
export function buildWhatsAppLink(phoneNumber: string, message?: string): string {
  if (!message) return `https://wa.me/${phoneNumber}`;
  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}
