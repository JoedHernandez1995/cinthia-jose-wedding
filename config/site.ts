import type { Faq, GiftAccount } from "@/types/invitation";

/**
 * Single source of truth for the wedding's facts, copy, and contact
 * placeholders. Values marked "placeholder" still need to be replaced with
 * real details before shipping (see project README).
 */

export const siteMetadata = {
  title: "Cinthia & José — 7 de Noviembre 2026",
  description: "Invitación de boda de José & Cinthia",
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
  venueName: "Hacienda El Trapiche",
  venueCity: "Tegucigalpa, Honduras",
  venueAddress: "Boulevard Suyapa, Tegucigalpa",
};

export const calendarEvent = {
  fileName: "Boda-Jose-Cinthia.ics",
  summary: "Boda de José & Cinthia",
  location: "Hacienda El Trapiche, Tegucigalpa, Honduras",
  description: "Celebración de la boda de José y Cinthia.",
  // Same instant as `wedding.dateTimeIso` above, expressed in UTC for ICS.
  startUtc: "20261107T220000Z",
  endUtc: "20261108T040000Z",
};

// Contact placeholder — replace with the real WhatsApp number before shipping.
export const WHATSAPP_NUMBER = "50499999999";

export const whatsappMessages = {
  rsvpYes: "¡Hola! Confirmo que asistiré a la boda de José & Cinthia el 7 de noviembre. ¡Nos vemos ahí! 🎉",
  rsvpNo: "Hola, lamentablemente no podré asistir a la boda de José & Cinthia el 7 de noviembre. ¡Muchas felicidades a ambos!",
  dressCodeQuestion: "¡Hola! Tengo una duda sobre el atuendo para la boda de José & Cinthia.",
};

export const faqContact = {
  name: "Paola Andino",
};

// Placeholder Pinterest boards — swap for curated boards if desired.
export const pinterestLinks = {
  men: "https://www.pinterest.com/search/pins/?q=traje%20negro%20boda%20elegante",
  women: "https://www.pinterest.com/search/pins/?q=vestido%20largo%20negro%20gala",
};

// Placeholder — replace with the real shared recommendations document.
export const recommendationsLink = "https://docs.google.com/document/d/PON-AQUI-TU-DOCUMENTO/edit";

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
// missing from /public/photos. marquee-1, marquee-4-b and marquee-5-b have
// no source image yet.
export const marqueePhotoIds = [
  "marquee-1", "marquee-2", "marquee-3", "marquee-4", "marquee-5",
  "marquee-1-b", "marquee-2-b", "marquee-3-b", "marquee-4-b", "marquee-5-b",
];

export const faqs: Faq[] = [
  { id: "01", question: "¿Puedo traer un invitado?", answer: "Debido a espacio limitado, solo podremos recibir a los invitados indicados en la invitación. Agradecemos su comprensión." },
  { id: "02", question: "¿Están invitados los niños?", answer: "Aunque adoramos a los más pequeños, hemos decidido que nuestra celebración sea solo para adultos. Agradecemos su comprensión." },
  { id: "03", question: "¿La ceremonia y recepción son al aire libre?", answer: "Sí, todo el evento será al aire libre. La recepción se realizará bajo un toldo cubierto, sin aire acondicionado." },
  { id: "04", question: "¿Puedo tomar fotos durante la ceremonia?", answer: "Preferimos que no. Contamos con fotografía y videografía profesional para eso. Te pedimos guardar el teléfono y disfrutar el momento con nosotros." },
  { id: "05", question: "¿Hay algún código de vestimenta?", answer: "Sí, pedimos con cariño vestir de color negro. Encuentras todos los detalles en la sección de Vestimenta." },
];

export const giftAccounts: GiftAccount[] = [
  {
    label: "CUENTA EN LEMPIRAS · HONDURAS",
    primaryLine: "Banco: BAC Honduras",
    secondaryLine: "Cuenta de ahorros: 000-000-0000 · José López",
    copyText: "000-000-0000",
  },
  {
    label: "CUENTA EN DÓLARES · HONDURAS",
    primaryLine: "Banco: Banco Atlántida",
    secondaryLine: "Cuenta de ahorros: 000-000-0000 · Cinthia Cruz",
    copyText: "000-000-0000",
  },
  {
    label: "VENMO · PARA INVITADOS EN EE.UU.",
    primaryLine: "@Jose-Cinthia-Boda",
    copyText: "@Jose-Cinthia-Boda",
  },
];
