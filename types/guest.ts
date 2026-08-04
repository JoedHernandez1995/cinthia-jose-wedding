export type RsvpStatus = "pending" | "yes" | "no";

/** Which side of the couple invited this guest. Null means not yet assigned. */
export type InvitedBy = "novio" | "novia";

/** Local (Honduras) vs. traveling from abroad — gates Ubicación/Recomendaciones and the gift-account list. Null (not yet assigned) is treated as local. */
export type GuestLocation = "local" | "extranjero";

/** A single named plus-one, with their own identity and check-in code (one QR each). */
export interface GuestCompanion {
  id: string;
  name: string;
  checkinCode: string;
}

/** Row shape of the `guests` table, camelCased. */
export interface Guest {
  id: string;
  token: string;
  name: string;
  /** Optional family/group name shown on the invitation instead of `name` (e.g. "Familia Martínez"). Falls back to `name` when null. */
  displayName: string | null;
  whatsappNumber: string;
  email: string | null;
  checkinCode: string;
  invitedBy: InvitedBy | null;
  guestLocation: GuestLocation | null;
  /** Total people allowed in this guest's party, including the named guest themselves. */
  partySizeAllowed: number;
  inviteSent: boolean;
  inviteSentAt: string | null;
  rsvpStatus: RsvpStatus;
  rsvpAttendingCount: number | null;
  /** Derived from `companions` (source of truth) — kept for callers that only need names. */
  companionNames: string[];
  companions: GuestCompanion[];
  rsvpRespondedAt: string | null;
  confirmationSentAt: string | null;
  confirmationSendError: string | null;
  firstViewedAt: string | null;
  lastViewedAt: string | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

/** A single validated row parsed from an uploaded CSV, ready to upsert. */
export interface GuestCsvRow {
  name: string;
  displayName: string | null;
  whatsappNumber: string;
  invitedBy: InvitedBy | null;
  guestLocation: GuestLocation | null;
  partySizeAllowed: number;
}

export interface CsvRowError {
  row: number;
  reason: string;
}

export interface CsvUploadResult {
  inserted: number;
  updated: number;
  skipped: CsvRowError[];
}

/** What a guest's own personal page needs — a trimmed-down view of `Guest`. */
export interface GuestViewModel {
  token: string;
  name: string;
  /** Resolved: `displayName` if set, otherwise `name` — always ready to render. */
  displayName: string;
  email: string | null;
  guestLocation: GuestLocation | null;
  partySizeAllowed: number;
  rsvpStatus: RsvpStatus;
  rsvpAttendingCount: number | null;
  companionNames: string[];
}

export interface SubmitRsvpInput {
  status: Exclude<RsvpStatus, "pending">;
  companionNames: string[];
  /** Required (validated) when status is "yes" on the guest-facing form; optional on admin override. */
  email?: string;
}
