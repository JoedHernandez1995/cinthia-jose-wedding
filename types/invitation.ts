export interface Faq {
  id: string;
  question: string;
  answer: string;
}

export type GiftAccountAudience = "local" | "abroad";

export interface GiftAccount {
  id: string;
  audience: GiftAccountAudience;
  label: string;
  primaryLine: string;
  secondaryLine?: string;
  copyText: string;
}

export interface CountdownUnit {
  label: string;
  value: string;
}

export type RecommendationCategoryId = "hospedaje" | "belleza" | "trajes";

export interface RecommendationEntry {
  id: string;
  category: RecommendationCategoryId;
  name: string;
  description?: string;
  /** Google Maps link for this place, rendered as "Ver en Google Maps". */
  mapsLink?: string;
  /** Digits (with or without a leading `+`) — rendered as a `wa.me` WhatsApp link. */
  phone?: string;
  link?: string;
}

export interface RecommendationCategory {
  id: RecommendationCategoryId;
  title: string;
  entries: RecommendationEntry[];
}
