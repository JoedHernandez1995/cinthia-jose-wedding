export type RsvpChoice = "yes" | "no" | null;

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
