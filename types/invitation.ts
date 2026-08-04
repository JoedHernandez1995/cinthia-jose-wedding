export interface Faq {
  id: string;
  question: string;
  answer: string;
}

export interface GiftAccount {
  label: string;
  primaryLine: string;
  secondaryLine?: string;
  copyText: string;
}

export interface CountdownUnit {
  label: string;
  value: string;
}

export interface RecommendationEntry {
  name: string;
  description?: string;
  /** Google Maps link for this place, rendered as "Ver en Google Maps". */
  mapsLink?: string;
  /** Digits (with or without a leading `+`) — rendered as a `wa.me` WhatsApp link. */
  phone?: string;
  link?: string;
}

export interface RecommendationCategory {
  id: string;
  title: string;
  entries: RecommendationEntry[];
}
