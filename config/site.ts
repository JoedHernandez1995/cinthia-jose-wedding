import type { Faq } from "@/types/invitation";

/**
 * Single source of truth for the wedding's facts, copy, and contact
 * placeholders. Values marked "placeholder" still need to be replaced with
 * real details before shipping (see project README).
 */

export const siteMetadata = {
  title: "Cinthia & José | 7 de Noviembre 2026",
  description: "Invitación de boda de Cinthia & José",
  // Used for the link-preview card (WhatsApp, etc.) — actual pixel size is 750x1125.
  ogImagePath: "/photos/hero-photo.webp",
  ogImageWidth: 750,
  ogImageHeight: 1125,
};

export const coupleNames = {
  full: "Cinthia & José",
};

export const wedding = {
  // Countdown target — must represent the same instant as `calendarEvent`
  // below (16:00 -06:00 America/Tegucigalpa == 22:00 UTC).
  dateTimeIso: "2026-11-07T16:00:00-06:00",
  heroDateLabel: "07 NOVIEMBRE 2026",
  dateLabel: "SÁBADO, 7 NOVIEMBRE DE 2026",
  timeLabel: "A PARTIR DE LAS 4:00 P.M.",
  rsvpDeadlineLabel: "1 de octubre, 2026",
  // Same instant as `rsvpDeadlineLabel` above, used to flag (not block) late RSVPs.
  rsvpDeadlineIso: "2026-10-01T23:59:59-06:00",
  venueName: "Hacienda El Trapiche",
  venueCity: "Tegucigalpa, Honduras",
  venueAddress: "Boulevard Suyapa, Tegucigalpa",
  dressCode: "Formal · Vestir de color negro",
};

export const calendarEvent = {
  fileName: "Boda-Jose-Cinthia.ics",
  summary: "Boda de Cinthia & José",
  location: "Hacienda El Trapiche, Tegucigalpa, Honduras",
  description: "Celebración de la boda de Cinthia & José.",
  // Same instant as `wedding.dateTimeIso` above, expressed in UTC for ICS.
  startUtc: "20261107T220000Z",
  // Nov 8, 1:00 AM -06:00 == 07:00 UTC.
  endUtc: "20261108T070000Z",
};

// Contact placeholder — replace with the real WhatsApp number before shipping.
export const WHATSAPP_NUMBER = "50497740066";

// Wedding planner's WhatsApp number — receives a courtesy notification after
// each guest RSVP. Placeholder, replace before shipping.
export const plannerWhatsAppNumber = "50497740066";

export const whatsappMessages = {
  // The wedding planner only sees this message as a raw WhatsApp text, so the guest's name must
  // always be spelled out in the text itself — she has no other way to know who's writing her.
  rsvpLastMinute: (guestName: string): string =>
    `Hola, soy ${guestName}. La confirmación para la boda de Cinthia & José ya cerró, pero necesito avisarles de un cambio de último momento en mi respuesta.`,
  dressCodeQuestion: "¡Hola! Tengo una duda sobre el código de vestimenta para la boda de Cinthia & José.",
  // Same "who's writing" reasoning as rsvpLastMinute — go by the family display name only when one
  // is actually set AND there's room for others (partySizeAllowed > 1); otherwise use the guest's
  // own name, same rule used everywhere else this distinction matters.
  faqContactQuestion: (guestName: string, displayName: string, isFamily: boolean): string =>
    isFamily
      ? `Hola, les escribe ${displayName} y tengo una duda sobre la boda de Cinthia & José.`
      : `Hola, mi nombre es ${guestName} y tengo una duda sobre la boda de Cinthia & José.`,
};

export const faqContact = {
  name: "Paola Andino",
};

// Placeholder Pinterest boards — swap for curated boards if desired.
export const pinterestLinks = {
  men: "https://pin.it/6Pnbe2NMp",
  women: "https://pin.it/4c0t5axqI",
};

export const mapsLink = "https://maps.google.com/?q=Hacienda+El+Trapiche+Tegucigalpa";

/** Anchor ids shared between the nav links and their target sections. */
export const sectionIds = {
  historia: "historia",
  detalles: "detalles",
  rsvp: "rsvp",
  vestimenta: "vestimenta",
  recomendaciones: "recomendaciones",
  faq: "faq",
} as const;

// Marquee photo ids — Photo falls back to a placeholder if the file is
// missing from /public/photos.
export const marqueePhotoIds = [
  "marquee-original-hero",
  "marquee-1", "marquee-2", "marquee-3", "marquee-4", "marquee-5",
  "marquee-1-b", "marquee-2-b", "marquee-3-b", "marquee-4-b", "marquee-5-b",
];

export const faqs: Faq[] = [
  { id: "01", question: "¿Puedo traer un invitado?", answer: "Por el espacio limitado, solo podemos recibir a quienes están indicados en la invitación. Gracias por entendernos." },
  { id: "02", question: "¿Están invitados los niños?", answer: "Aunque adoramos a los más pequeños, decidimos que esta celebración sea solo para adultos. Gracias por entendernos." },
  { id: "03", question: "¿La ceremonia y recepción son al aire libre?", answer: "Sí, todo el evento va a ser al aire libre. La recepción va a ser bajo un toldo cubierto, sin aire acondicionado." },
  { id: "04", question: "¿Puedo tomar fotos durante la ceremonia?", answer: "Preferimos que no. Contamos con fotografía y videografía profesional para eso. Te pedimos guardar el teléfono y disfrutar el momento con nosotros." },
  { id: "05", question: "¿Hay algún código de vestimenta?", answer: "Sí, pedimos con cariño vestir de color negro. Encontrás todos los detalles en la sección de Vestimenta." },
];

