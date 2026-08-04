/** Builds a `wa.me` deep link, optionally pre-filling the message text. */
export function buildWhatsAppLink(phoneNumber: string, message?: string): string {
  if (!message) return `https://wa.me/${phoneNumber}`;
  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}

/**
 * Builds the pre-filled message the guest sends to the wedding planner right
 * after their RSVP is saved — a courtesy heads-up, not the source of truth
 * (the database write already happened by the time this is built).
 */
export function buildPlannerNotificationMessage(
  guestName: string,
  status: "yes" | "no",
  companionNames: string[],
): string {
  if (status === "no") {
    return `RSVP: ${guestName} indicó que no podrá asistir a la boda.`;
  }
  if (companionNames.length === 0) {
    return `RSVP: ${guestName} confirmó asistencia (sin acompañantes) a la boda de José & Cinthia el 7 de noviembre.`;
  }
  return `RSVP: ${guestName} confirmó asistencia con ${companionNames.length} acompañante(s): ${companionNames.join(", ")} a la boda de José & Cinthia el 7 de noviembre.`;
}
