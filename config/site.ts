import type { Faq, GiftAccount, RecommendationCategory } from "@/types/invitation";

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
export const WHATSAPP_NUMBER = "50499999999";

// Wedding planner's WhatsApp number — receives a courtesy notification after
// each guest RSVP. Placeholder, replace before shipping.
export const plannerWhatsAppNumber = "50497740066";

export const whatsappMessages = {
  // The wedding planner only sees this message as a raw WhatsApp text, so the guest's name must
  // always be spelled out in the text itself — she has no other way to know who's writing her.
  rsvpLastMinute: (guestName: string): string =>
    `Hola, soy ${guestName}. La confirmación para la boda de Cinthia & José ya cerró, pero necesito avisarles de un cambio de último momento en mi respuesta.`,
  dressCodeQuestion: "¡Hola! Tengo una duda sobre el código de vestimenta para la boda de Cinthia & José.",
};

export const faqContact = {
  name: "Paola Andino",
};

// Placeholder Pinterest boards — swap for curated boards if desired.
export const pinterestLinks = {
  men: "https://pin.it/6Pnbe2NMp",
  women: "https://pin.it/4c0t5axqI",
};

// Placeholder entries — replace name/description/address/phone/link with the real recommendations
// before shipping. Each category renders as its own accordion item on the Recomendaciones page.
export const recommendationCategories: RecommendationCategory[] = [
  {
    id: "hospedaje",
    title: "Hospedaje",
    entries: [
      {
        name: "Hotel Real Intercontinental",
        description: "Opcion premium a 10 minutos de Hacienda El Trapiche. Frente a Mall Multiplaza Tegucigalpa, con piscina y spa.",
        mapsLink: "https://maps.app.goo.gl/ciqmdXhsCjqLTCnu7",
        phone: "50494612700",
        link: "https://www.ihg.com/intercontinental/hotels/es/es/tegucigalpa/tguha/hoteldetail",
      },
      {
        name: "Hotel Clarion",
        description: "A 15 minutos de Hacienda El Trapiche. Los novios se hospedarán aquí, y recomiendan este hotel a los invitados que deseen estar cerca del lugar de la boda y estar cerca de los novios antes y después de la ceremonia.",
        mapsLink: "https://maps.app.goo.gl/q4Vv9BQHv1CjXgjt5",
        phone: "50431900908",
        link: "https://www.choicehotels.com/honduras/tegucigalpa/clarion-hotels/hn004?sjrncid=GA_21646766086&sjrnaid=GA_711450267771&sjrnclid=GA_clarion%20hotel%20real%20tegucigalpa&gclsrc=aw.ds&gad_source=1&gad_campaignid=21646766086&gbraid=0AAAAA-KA7OndIzw64JoSz1zPN1DG8e57M&gclid=Cj0KCQjwm8bTBhDWARIsAC9Hi8nOWQEoVWj8oDLiGr5d1t7kzFmybqlI1LuwxpRUOwcJiWwEAC3ehmwaAqXyEALw_wcBs",
      },
      {
        name: "Hotel Alameda",
        description: "A 10 minutos de Hacienda El Trapiche. Hotel recien remodelado. Recomendado para invitados que deseen hospedarse cerca del lugar de la boda y disfrutar de un ambiente tranquilo y acogedor.",
        mapsLink: "https://maps.app.goo.gl/W2Fx9c8rJmAzo3Nz9",
        phone: "50422322222",
        link: "https://hotelalameda.hn/",
      },
      {
        name: "Hotel Plaza Florencia",
        description: "A 5 minutos de Hacienda El Trapiche. Muy cerca y accesible a todos lados. Recomendado para invitados que deseen hospedarse cerca del lugar de la boda y poder movilizarse fácilmente.",
        mapsLink: "https://maps.app.goo.gl/WmRBHj9nf3oVp32v5",
        phone: "50422296900",
        link: "https://florenciaplazahotel.com/",
      },
      {
        name: "Holiday Inn Express Tegucigalpa",
        description: "A 15 minutos de Hacienda El Trapiche y cerca de Mall Multiplaza y Lomas del Mayab. Facil acceso y ambiente relajado.",
        mapsLink: "https://www.google.com/maps?q=Holiday+Inn+Express,Colonia+Lomas+del+Mayab,Tegucigalpa,Honduras,11101",
        phone: "50422753400",
        link: "https://www.ihg.com/holidayinnexpress/hotels/us/en/tegucigalpa/tguex/hoteldetail",
      },
      {
        name: "Hyatt Place",
        description: "A 20 minutos de Hacienda El Trapiche. Excelente desayuno. Ubicado en una de las mejores zonas con vida nocturna de Tegucigalpa. Recomendado para invitados que deseen hospedarse en un hotel de lujo y disfrutar de una experiencia completa.",
        mapsLink: "https://www.google.com/maps/place/Hyatt+Place+Tegucigalpa/data=!4m2!3m1!1s0x0:0xc877d44ab568cfc1?sa=X&ved=1t:2428&ictx=111",
        phone: "50422296900",
        link: "https://www.hyatt.com/hyatt-place/en-US/tguzt-hyatt-place-tegucigalpa"
      }
    ],
  },
  {
    id: "belleza",
    title: "Cabello y Maquillaje",
    entries: [
      {
        name: "Oney Beauty Studio",
        phone: "+50433875975",
        link: "https://www.instagram.com/oneybeautystudio?igsh=MXQydWt4cm8yeWswcg==",
      },
      {
        name: "MCBSTUDIO",
        phone: "+50433909044",
        link: "https://www.instagram.com/mcbstudio?igsh=MTFveWJ4YTFxMmg5cA==",
      },
      {
        name: "Monique pineda Studio",
        phone: "+50489137279",
        link: "https://www.bymoniquepineda.com/services-4?fbclid=PAdGRleATgatRwZG9mAmV4dG4DYWVtAjExAHNydGMGYXBwX2lkDzEyNDAyNDU3NDI4NzQxNAABpyxhR8TnjrgGR3c-OscgWg4dp7hDQQkAhDpUxt6R-Qi2wLfP8DZX8Mhbh2H5_aem_RkL_LoNQEOXLtSV64ovxDw&utm_source=ig&utm_medium=social&utm_content=link_in_bio",
      },
      {
        name: "Diana Hernandez Makeup Artist",
        link: "https://www.instagram.com/dianahmakeup?igsh=MWtmZWx4NnFxY2Vscw==",
      }
    ],
  },
  {
    id: "trajes",
    title: "Alquiler de Trajes y Vestidos",
    entries: [
      {
        name: "Mr. Tux",
        phone: "+50433477851",
        link: "https://www.instagram.com/mr.tuxhonduras?igsh=bGR5bWg5MWJxNWkz",
      },
      {
        name: "Black Tie | Formal Menswear",
        phone: "+50494022795",
        link: "https://www.instagram.com/blacktie.hn?igsh=MWdzdXB4enlwenBqeQ==",
      },
    ],
  },
];

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

/** Shown to local (Honduras) guests — Honduran bank accounts, impractical to wire to from abroad. */
export const giftAccountsLocal: GiftAccount[] = [
  {
    label: "CUENTA EN LEMPIRAS · HONDURAS",
    primaryLine: "BAC Honduras",
    secondaryLine: "#749334921 · José Eduardo Hernandez Alvarado",
    copyText: "749334921",
  },
  {
    label: "CUENTA EN DÓLARES · HONDURAS",
    primaryLine: "BAC Honduras",
    secondaryLine: "#753329341 · José Eduardo Hernandez Alvarado",
    copyText: "753329341",
  },
  {
    label: "CUENTA EN LEMPIRAS · HONDURAS",
    primaryLine: "FICOHSA",
    secondaryLine: "#200021669112 · José Eduardo Hernandez Alvarado",
    copyText: "200021669112",
  },
  {
    label: "CUENTA EN DÓLARES · HONDURAS",
    primaryLine: "FICOHSA",
    secondaryLine: "#200006815517 · José Eduardo Hernandez Alvarado",
    copyText: "200006815517",
  },
];

/** Shown to guests traveling from abroad — a Honduran bank transfer isn't practical for them. */
export const giftAccountsAbroad: GiftAccount[] = [
  {
    label: "Venmo",
    primaryLine: "@Jose-Cinthia-Boda",
    copyText: "@Jose-Cinthia-Boda",
  },
  {
    label: "Paypal",
    primaryLine: "@Jeha1995",
    copyText: "@Jeha1995",
  },
];
