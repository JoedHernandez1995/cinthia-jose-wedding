import "server-only";
import { randomBytes } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { sendGuestConfirmation } from "@/lib/confirmation";
import { wedding } from "@/config/site";
import type {
  ActivityEntry,
  CheckinResult,
  CsvRowError,
  CsvUploadResult,
  Guest,
  GuestCompanion,
  GuestCsvRow,
  GuestLocation,
  GuestViewModel,
  InvitedBy,
  RsvpStatus,
  SubmitRsvpInput,
} from "@/types/guest";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Raw `guests` row shape as it comes back from Supabase (snake_case). */
interface GuestRow {
  id: string;
  token: string;
  name: string;
  display_name: string | null;
  whatsapp_number: string;
  email: string | null;
  checkin_code: string;
  invited_by: InvitedBy | null;
  guest_location: GuestLocation | null;
  party_size_allowed: number;
  invite_sent: boolean;
  invite_sent_at: string | null;
  rsvp_status: RsvpStatus;
  rsvp_attending_count: number | null;
  rsvp_responded_at: string | null;
  confirmation_sent_at: string | null;
  confirmation_send_error: string | null;
  checked_in: boolean;
  checked_in_at: string | null;
  first_viewed_at: string | null;
  last_viewed_at: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
}

interface GuestCompanionRow {
  id: string;
  guest_id: string;
  name: string;
  checkin_code: string;
  position: number;
  checked_in: boolean;
  checked_in_at: string | null;
}

function mapCompanionRow(row: GuestCompanionRow): GuestCompanion {
  return {
    id: row.id,
    name: row.name,
    checkinCode: row.checkin_code,
    checkedIn: row.checked_in,
    checkedInAt: row.checked_in_at,
  };
}

function mapRow(row: GuestRow, companions: GuestCompanion[]): Guest {
  return {
    id: row.id,
    token: row.token,
    name: row.name,
    displayName: row.display_name,
    whatsappNumber: row.whatsapp_number,
    email: row.email,
    checkinCode: row.checkin_code,
    invitedBy: row.invited_by,
    guestLocation: row.guest_location,
    partySizeAllowed: row.party_size_allowed,
    inviteSent: row.invite_sent,
    inviteSentAt: row.invite_sent_at,
    rsvpStatus: row.rsvp_status,
    rsvpAttendingCount: row.rsvp_attending_count,
    companionNames: companions.map((c) => c.name),
    companions,
    checkedIn: row.checked_in,
    checkedInAt: row.checked_in_at,
    rsvpRespondedAt: row.rsvp_responded_at,
    confirmationSentAt: row.confirmation_sent_at,
    confirmationSendError: row.confirmation_send_error,
    firstViewedAt: row.first_viewed_at,
    lastViewedAt: row.last_viewed_at,
    viewCount: row.view_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function fetchCompanions(guestId: string): Promise<GuestCompanion[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("guest_companions")
    .select("id, guest_id, name, checkin_code, position, checked_in, checked_in_at")
    .eq("guest_id", guestId)
    .order("position");
  if (error) throw error;
  return (data as GuestCompanionRow[]).map(mapCompanionRow);
}

/** Batch-fetches companions for many guests in one query, grouped by guest id. No N+1. */
async function fetchCompanionsForGuestIds(guestIds: string[]): Promise<Map<string, GuestCompanion[]>> {
  const byGuestId = new Map<string, GuestCompanion[]>();
  if (guestIds.length === 0) return byGuestId;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("guest_companions")
    .select("id, guest_id, name, checkin_code, position, checked_in, checked_in_at")
    .in("guest_id", guestIds)
    .order("position");
  if (error) throw error;

  for (const row of data as GuestCompanionRow[]) {
    const list = byGuestId.get(row.guest_id) ?? [];
    list.push(mapCompanionRow(row));
    byGuestId.set(row.guest_id, list);
  }
  return byGuestId;
}

/** Trims a full `Guest` row down to what a guest's own personal pages need. */
export function toGuestViewModel(guest: Guest): GuestViewModel {
  return {
    token: guest.token,
    name: guest.name,
    displayName: guest.displayName || guest.name,
    email: guest.email,
    guestLocation: guest.guestLocation,
    partySizeAllowed: guest.partySizeAllowed,
    rsvpStatus: guest.rsvpStatus,
    rsvpAttendingCount: guest.rsvpAttendingCount,
    companionNames: guest.companionNames,
  };
}

export async function getGuestByToken(token: string): Promise<Guest | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("guests").select("*").eq("token", token).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const companions = await fetchCompanions(data.id);
  return mapRow(data as GuestRow, companions);
}

export async function getGuestById(id: string): Promise<Guest | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("guests").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const companions = await fetchCompanions(data.id);
  return mapRow(data as GuestRow, companions);
}

export async function listGuests(): Promise<Guest[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("guests").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  const rows = data as GuestRow[];
  const companionsByGuestId = await fetchCompanionsForGuestIds(rows.map((r) => r.id));
  return rows.map((row) => mapRow(row, companionsByGuestId.get(row.id) ?? []));
}

export class DuplicateGuestError extends Error {}
export class GuestValidationError extends Error {}

/** Postgres unique_violation — thrown by the `import_key` index when a name+phone pair already exists. */
function isDuplicateKeyError(error: { code?: string }): boolean {
  return error.code === "23505";
}

export async function createGuest(input: GuestCsvRow): Promise<Guest> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("guests")
    .insert({
      name: input.name,
      display_name: input.displayName,
      whatsapp_number: input.whatsappNumber,
      invited_by: input.invitedBy,
      guest_location: input.guestLocation,
      party_size_allowed: input.partySizeAllowed,
    })
    .select("*")
    .single();
  if (error) {
    if (isDuplicateKeyError(error)) {
      throw new DuplicateGuestError(`Ya existe un invitado con el nombre y número "${input.name}".`);
    }
    throw error;
  }
  return mapRow(data as GuestRow, []);
}

/** Postgres check_violation — the DB-level backstop (`guests_attending_count_check` in `supabase/schema.sql`) for the same invariant this function pre-checks in JS. Catches the race the pre-check can't: a guest's RSVP raising `rsvp_attending_count` between this function's read and its write. */
function isAttendingCountCheckViolation(error: { code?: string; message?: string }): boolean {
  return error.code === "23514" && (error.message ?? "").includes("guests_attending_count_check");
}

export async function updateGuest(id: string, input: GuestCsvRow): Promise<Guest> {
  const existing = await getGuestById(id);
  if (!existing) throw new GuestValidationError("Invitado no encontrado.");

  const minPartySize = existing.companionNames.length + 1;
  if (input.partySizeAllowed < minPartySize) {
    throw new GuestValidationError(
      `No puedes bajar a ${input.partySizeAllowed} persona(s): ${existing.name} ya confirmó un total de ${minPartySize} (incluyéndolo a él/ella: ${existing.companionNames.join(", ")}). Corrige primero su RSVP en "Corrección manual" antes de reducir el límite.`,
    );
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("guests")
    .update({
      name: input.name,
      display_name: input.displayName,
      whatsapp_number: input.whatsappNumber,
      invited_by: input.invitedBy,
      guest_location: input.guestLocation,
      party_size_allowed: input.partySizeAllowed,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    if (isDuplicateKeyError(error)) {
      throw new DuplicateGuestError(`Ya existe otro invitado con el nombre y número "${input.name}".`);
    }
    if (isAttendingCountCheckViolation(error)) {
      throw new GuestValidationError(
        `No puedes bajar a ${input.partySizeAllowed} persona(s): ${existing.name} confirmó más asistentes justo ahora. Corrige primero su RSVP en "Corrección manual" antes de reducir el límite.`,
      );
    }
    throw error;
  }
  // Companions are untouched by this action — reuse what we already fetched above.
  return mapRow(data as GuestRow, existing.companions);
}

export async function deleteGuest(id: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("guests").delete().eq("id", id);
  if (error) throw error;
}

export async function markInviteSent(id: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("guests")
    .update({ invite_sent: true, invite_sent_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

/** Same as `markInviteSent`, for many guests in one round trip — the admin table's bulk "mark as sent" action. */
export async function bulkMarkInviteSent(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("guests")
    .update({ invite_sent: true, invite_sent_at: new Date().toISOString() })
    .in("id", ids);
  if (error) throw error;
}

export async function markConfirmationSent(id: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("guests")
    .update({ confirmation_sent_at: new Date().toISOString(), confirmation_send_error: null })
    .eq("id", id);
  if (error) throw error;
}

export async function markConfirmationFailed(id: string, message: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("guests").update({ confirmation_send_error: message }).eq("id", id);
  if (error) throw error;
}

export async function regenerateToken(id: string): Promise<string> {
  const supabase = createSupabaseAdminClient();
  // Short (12 hex chars) to match the DB default — friendlier to share over WhatsApp than a full UUID.
  const newToken = randomBytes(6).toString("hex");
  const { error } = await supabase.from("guests").update({ token: newToken }).eq("id", id);
  if (error) throw error;
  return newToken;
}

export async function recordGuestView(guestId: string, userAgent: string | null): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.rpc("record_guest_view", {
    p_guest_id: guestId,
    p_user_agent: userAgent,
  });
  if (error) throw error;
}

export class RsvpValidationError extends Error {}

/** Sets a guest's email address on its own — used at the envelope gate, before any RSVP choice is made. */
export async function setGuestEmail(token: string, email: string): Promise<Guest> {
  const trimmed = email.trim();
  if (!EMAIL_RE.test(trimmed)) {
    throw new RsvpValidationError("Ingresa un correo electrónico válido.");
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("guests").update({ email: trimmed }).eq("token", token).select("*").single();
  if (error) throw error;

  const companions = await fetchCompanions(data.id);
  return mapRow(data as GuestRow, companions);
}

/** Postgres errors raised by `apply_rsvp()` (see `supabase/schema.sql`) arrive as plain `RAISE EXCEPTION` messages. */
function rsvpRpcErrorMessage(error: { message?: string }): string | null {
  const message = error.message ?? "";
  if (message.includes("guest_not_found")) return "guest_not_found";
  if (message.includes("too_many_companions")) return "too_many_companions";
  if (message.includes("rate_limited")) return "rate_limited";
  return null;
}

/**
 * Validates against `partySizeAllowed` server-side (never trust a client-sent count) and persists
 * the response by calling the `apply_rsvp` Postgres function, which locks the guest row and does
 * the status/companion-sync/event-log writes in one transaction — this closes the read-then-write
 * race the previous implementation had between concurrent submissions for the same guest, and
 * enforces a resubmission cooldown atomically so repeated calls can't spam confirmation emails.
 */
export async function submitRsvp(token: string, input: SubmitRsvpInput): Promise<{ guest: Guest; confirmationSent: boolean }> {
  const guest = await getGuestByToken(token);
  if (!guest) throw new RsvpValidationError("Invitado no encontrado.");

  const companionNames = input.status === "yes" ? input.companionNames.map((n) => n.trim()).filter(Boolean) : [];
  const maxCompanions = guest.partySizeAllowed - 1;

  // Pre-checked here too (in addition to the DB function) purely for a friendlier error message —
  // the DB function is the authoritative enforcement, not this.
  if (companionNames.length > maxCompanions) {
    throw new RsvpValidationError(`Tu invitación es válida para ${guest.partySizeAllowed} persona(s) en total.`);
  }

  const email = input.email?.trim() ?? "";
  if (!EMAIL_RE.test(email)) {
    throw new RsvpValidationError("Ingresa un correo electrónico válido para recibir la confirmación por correo.");
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.rpc("apply_rsvp", {
    p_guest_id: guest.id,
    p_status: input.status,
    p_email: email,
    p_companion_names: companionNames,
  });
  if (error) {
    const code = rsvpRpcErrorMessage(error);
    if (code === "guest_not_found") throw new RsvpValidationError("Invitado no encontrado.");
    if (code === "too_many_companions") {
      throw new RsvpValidationError(`Tu invitación es válida para ${guest.partySizeAllowed} persona(s) en total.`);
    }
    if (code === "rate_limited") {
      throw new RsvpValidationError("Ya recibimos tu respuesta hace unos segundos. Espera un momento antes de volver a intentar.");
    }
    throw error;
  }

  const updatedGuest = await getGuestByToken(token);
  if (!updatedGuest) throw new RsvpValidationError("Invitado no encontrado.");

  // Runs strictly after the RSVP save above has already committed; never
  // throws, so a PDF/email failure can never roll back or block the save. Sent for both "yes" and
  // "no" — every guest gets a copy of their response plus a link to edit it before the deadline.
  const confirmationSent = await sendGuestConfirmation(updatedGuest);

  return { guest: updatedGuest, confirmationSent };
}

/** Parses/validates raw CSV rows; does not touch the database. Returns valid rows plus per-row errors. */
export function parseGuestCsvRows(
  rawRows: Record<string, string>[],
): { rows: GuestCsvRow[]; errors: CsvRowError[] } {
  const rows: GuestCsvRow[] = [];
  const errors: CsvRowError[] = [];

  rawRows.forEach((raw, index) => {
    const rowNumber = index + 2; // +1 for 0-index, +1 for the header line
    const name = (raw.name ?? "").trim();
    const displayName = (raw.display_name ?? "").trim() || null;
    const phoneDigits = (raw.whatsapp_number ?? "").replace(/\D/g, "");
    const partySizeRaw = (raw.party_size_allowed ?? "").trim();
    const invitedByRaw = (raw.invited_by ?? "").trim().toLowerCase();
    const guestLocationRaw = (raw.guest_location ?? "").trim().toLowerCase();

    if (!name) {
      errors.push({ row: rowNumber, reason: "Falta el nombre." });
      return;
    }
    if (phoneDigits.length < 8 || phoneDigits.length > 15) {
      errors.push({ row: rowNumber, reason: `Número de WhatsApp inválido: "${raw.whatsapp_number ?? ""}".` });
      return;
    }
    const partySizeAllowed = partySizeRaw === "" ? 1 : Number(partySizeRaw);
    if (!Number.isInteger(partySizeAllowed) || partySizeAllowed < 1) {
      errors.push({ row: rowNumber, reason: `Cantidad total de personas inválida: "${partySizeRaw}".` });
      return;
    }
    let invitedBy: InvitedBy | null = null;
    if (invitedByRaw !== "") {
      if (invitedByRaw !== "novio" && invitedByRaw !== "novia") {
        errors.push({ row: rowNumber, reason: `"invited_by" debe ser "novio" o "novia" (o vacío): "${raw.invited_by}".` });
        return;
      }
      invitedBy = invitedByRaw;
    }
    let guestLocation: GuestLocation | null = null;
    if (guestLocationRaw !== "") {
      if (guestLocationRaw !== "local" && guestLocationRaw !== "extranjero") {
        errors.push({
          row: rowNumber,
          reason: `"guest_location" debe ser "local" o "extranjero" (o vacío): "${raw.guest_location}".`,
        });
        return;
      }
      guestLocation = guestLocationRaw;
    }

    rows.push({ name, displayName, whatsappNumber: phoneDigits, invitedBy, guestLocation, partySizeAllowed });
  });

  return { rows, errors };
}

function importKeyOf(row: Pick<GuestCsvRow, "name" | "whatsappNumber">): string {
  return `${row.name.toLowerCase().trim()}|${row.whatsappNumber}`;
}

export async function upsertGuestsFromCsv(rows: GuestCsvRow[]): Promise<Omit<CsvUploadResult, "skipped">> {
  if (rows.length === 0) return { inserted: 0, updated: 0 };

  const supabase = createSupabaseAdminClient();

  // Detect existing rows by import_key first so we can report insert vs. update counts —
  // upsert alone doesn't tell us which happened.
  const importKeys = rows.map(importKeyOf);
  const { data: existing, error: existingError } = await supabase
    .from("guests")
    .select("import_key")
    .in("import_key", importKeys);
  if (existingError) throw existingError;
  const existingKeys = new Set((existing as { import_key: string }[]).map((r) => r.import_key));

  const { error } = await supabase.from("guests").upsert(
    rows.map((r) => ({
      name: r.name,
      whatsapp_number: r.whatsappNumber,
      party_size_allowed: r.partySizeAllowed,
    })),
    { onConflict: "import_key" },
  );
  if (error) throw error;

  // invited_by/guest_location/display_name are only written when the CSV row
  // explicitly specifies them, via separate targeted updates — so a
  // re-upload with those columns blank never silently clears a value set
  // later via the admin edit form.
  const novioKeys = rows.filter((r) => r.invitedBy === "novio").map(importKeyOf);
  const noviaKeys = rows.filter((r) => r.invitedBy === "novia").map(importKeyOf);
  if (novioKeys.length > 0) {
    const { error: novioError } = await supabase.from("guests").update({ invited_by: "novio" }).in("import_key", novioKeys);
    if (novioError) throw novioError;
  }
  if (noviaKeys.length > 0) {
    const { error: noviaError } = await supabase.from("guests").update({ invited_by: "novia" }).in("import_key", noviaKeys);
    if (noviaError) throw noviaError;
  }

  const localKeys = rows.filter((r) => r.guestLocation === "local").map(importKeyOf);
  const extranjeroKeys = rows.filter((r) => r.guestLocation === "extranjero").map(importKeyOf);
  if (localKeys.length > 0) {
    const { error: localError } = await supabase.from("guests").update({ guest_location: "local" }).in("import_key", localKeys);
    if (localError) throw localError;
  }
  if (extranjeroKeys.length > 0) {
    const { error: extranjeroError } = await supabase
      .from("guests")
      .update({ guest_location: "extranjero" })
      .in("import_key", extranjeroKeys);
    if (extranjeroError) throw extranjeroError;
  }

  for (const row of rows) {
    if (!row.displayName) continue;
    const { error: displayNameError } = await supabase
      .from("guests")
      .update({ display_name: row.displayName })
      .eq("import_key", importKeyOf(row));
    if (displayNameError) throw displayNameError;
  }

  const updated = importKeys.filter((k) => existingKeys.has(k)).length;
  return { inserted: rows.length - updated, updated };
}

export interface GuestViewRow {
  id: number;
  viewedAt: string;
  userAgent: string | null;
}

export async function listGuestViews(guestId: string): Promise<GuestViewRow[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("guest_views")
    .select("id, viewed_at, user_agent")
    .eq("guest_id", guestId)
    .order("viewed_at", { ascending: false });
  if (error) throw error;
  return (data as { id: number; viewed_at: string; user_agent: string | null }[]).map((r) => ({
    id: r.id,
    viewedAt: r.viewed_at,
    userAgent: r.user_agent,
  }));
}

/**
 * Builds a guest's admin-facing activity timeline (newest first): every invitation view, every
 * RSVP submission (labeled "confirmó"/"editó" depending on whether they'd already responded before),
 * and check-ins (guest + each companion) — merged from `guest_views`, `guest_rsvp_events`, and the
 * `checked_in`/`checked_in_at` columns on `guests`/`guest_companions`.
 */
export async function getGuestActivity(guest: Guest): Promise<ActivityEntry[]> {
  const supabase = createSupabaseAdminClient();

  const [{ data: viewRows, error: viewError }, { data: rsvpRows, error: rsvpError }] = await Promise.all([
    supabase.from("guest_views").select("viewed_at").eq("guest_id", guest.id),
    supabase.from("guest_rsvp_events").select("status, is_edit, occurred_at").eq("guest_id", guest.id),
  ]);
  if (viewError) throw viewError;
  if (rsvpError) throw rsvpError;

  const entries: ActivityEntry[] = [];

  for (const row of viewRows as { viewed_at: string }[]) {
    entries.push({ label: "Vio la invitación", occurredAt: row.viewed_at });
  }

  for (const row of rsvpRows as { status: RsvpStatus; is_edit: boolean; occurred_at: string }[]) {
    const status = row.status as Exclude<RsvpStatus, "pending">;
    let label: string;
    if (row.is_edit) {
      label = status === "yes" ? "Editó su respuesta (confirmó asistencia)" : "Editó su respuesta (no podrá asistir)";
    } else {
      label = status === "yes" ? "Confirmó su asistencia" : "Indicó que no podrá asistir";
    }
    entries.push({ label, occurredAt: row.occurred_at });
  }

  if (guest.checkedIn && guest.checkedInAt) {
    entries.push({ label: "Hizo check-in", occurredAt: guest.checkedInAt });
  }

  for (const companion of guest.companions) {
    if (companion.checkedIn && companion.checkedInAt) {
      entries.push({ label: `${companion.name} (acompañante) hizo check-in`, occurredAt: companion.checkedInAt });
    }
  }

  return entries.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
}

/**
 * Marks a guest or companion as checked in by their QR check-in code (the `/checkin/{code}` URL
 * encoded in their PDF QR). Idempotent — scanning an already-checked-in code just reports the
 * original timestamp back instead of erroring or overwriting it.
 */
export async function checkInByCode(code: string): Promise<CheckinResult | null> {
  const supabase = createSupabaseAdminClient();

  const { data: guestRow, error: guestError } = await supabase
    .from("guests")
    .select("id, name, checked_in, checked_in_at")
    .eq("checkin_code", code)
    .maybeSingle();
  if (guestError) throw guestError;

  if (guestRow) {
    if (guestRow.checked_in) {
      return {
        personName: guestRow.name,
        guestName: guestRow.name,
        isCompanion: false,
        alreadyCheckedIn: true,
        checkedInAt: guestRow.checked_in_at as string,
      };
    }
    // Atomic transition: only succeeds if `checked_in` is still false at write time, so two
    // near-simultaneous scans of the same code can't both report a fresh "success" — the loser
    // gets no row back and falls through to the query below, which sees the winner's update.
    const checkedInAt = new Date().toISOString();
    const { data: updated, error: updateError } = await supabase
      .from("guests")
      .update({ checked_in: true, checked_in_at: checkedInAt })
      .eq("id", guestRow.id)
      .eq("checked_in", false)
      .select("checked_in_at")
      .maybeSingle();
    if (updateError) throw updateError;
    if (updated) {
      return { personName: guestRow.name, guestName: guestRow.name, isCompanion: false, alreadyCheckedIn: false, checkedInAt };
    }
    const { data: current, error: refetchError } = await supabase
      .from("guests")
      .select("checked_in_at")
      .eq("id", guestRow.id)
      .single();
    if (refetchError) throw refetchError;
    return {
      personName: guestRow.name,
      guestName: guestRow.name,
      isCompanion: false,
      alreadyCheckedIn: true,
      checkedInAt: current.checked_in_at as string,
    };
  }

  const { data: companionRow, error: companionError } = await supabase
    .from("guest_companions")
    .select("id, name, guest_id, checked_in, checked_in_at")
    .eq("checkin_code", code)
    .maybeSingle();
  if (companionError) throw companionError;
  if (!companionRow) return null;

  const { data: parentGuest, error: parentError } = await supabase
    .from("guests")
    .select("name")
    .eq("id", companionRow.guest_id)
    .single();
  if (parentError) throw parentError;

  if (companionRow.checked_in) {
    return {
      personName: companionRow.name,
      guestName: parentGuest.name,
      isCompanion: true,
      alreadyCheckedIn: true,
      checkedInAt: companionRow.checked_in_at as string,
    };
  }

  const checkedInAt = new Date().toISOString();
  const { data: updatedCompanion, error: updateError } = await supabase
    .from("guest_companions")
    .update({ checked_in: true, checked_in_at: checkedInAt })
    .eq("id", companionRow.id)
    .eq("checked_in", false)
    .select("checked_in_at")
    .maybeSingle();
  if (updateError) throw updateError;

  if (updatedCompanion) {
    return {
      personName: companionRow.name,
      guestName: parentGuest.name,
      isCompanion: true,
      alreadyCheckedIn: false,
      checkedInAt,
    };
  }

  const { data: currentCompanion, error: refetchError } = await supabase
    .from("guest_companions")
    .select("checked_in_at")
    .eq("id", companionRow.id)
    .single();
  if (refetchError) throw refetchError;
  return {
    personName: companionRow.name,
    guestName: parentGuest.name,
    isCompanion: true,
    alreadyCheckedIn: true,
    checkedInAt: currentCompanion.checked_in_at as string,
  };
}

/**
 * Admin manual override — sets RSVP status directly by guest id, bypassing token lookup. Same
 * validation and atomic `apply_rsvp` write path as the guest-facing form, but email is optional
 * (guests who respond off-platform may have none on file) and the resubmission cooldown is
 * bypassed — an admin correcting a guest's RSVP right after they submitted it themselves
 * shouldn't be blocked by the same guard meant to stop a scripted client from spamming one guest.
 */
export async function overrideRsvp(id: string, input: SubmitRsvpInput): Promise<{ guest: Guest; confirmationSent: boolean }> {
  const guest = await getGuestById(id);
  if (!guest) throw new RsvpValidationError("Invitado no encontrado.");

  const companionNames = input.status === "yes" ? input.companionNames.map((n) => n.trim()).filter(Boolean) : [];
  const maxCompanions = guest.partySizeAllowed - 1;
  if (companionNames.length > maxCompanions) {
    throw new RsvpValidationError(`Esta invitación es válida para ${guest.partySizeAllowed} persona(s) en total.`);
  }

  const email = input.email?.trim() ?? "";
  if (email && !EMAIL_RE.test(email)) {
    throw new RsvpValidationError("El correo electrónico no es válido.");
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.rpc("apply_rsvp", {
    p_guest_id: id,
    p_status: input.status,
    p_email: email,
    p_companion_names: companionNames,
    p_bypass_cooldown: true,
  });
  if (error) {
    const code = rsvpRpcErrorMessage(error);
    if (code === "guest_not_found") throw new RsvpValidationError("Invitado no encontrado.");
    if (code === "too_many_companions") {
      throw new RsvpValidationError(`Esta invitación es válida para ${guest.partySizeAllowed} persona(s) en total.`);
    }
    throw error;
  }

  const updatedGuest = await getGuestById(id);
  if (!updatedGuest) throw new RsvpValidationError("Invitado no encontrado.");

  // Same as submitRsvp — sent for both "yes" and "no" when an email is on file (optional here,
  // since overridden guests may have responded off-platform with no email captured).
  const confirmationSent = await sendGuestConfirmation(updatedGuest);

  return { guest: updatedGuest, confirmationSent };
}

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Builds a CSV of every guest's current RSVP state — for the caterer/venue headcount. */
export async function exportGuestsCsv(): Promise<string> {
  const guests = await listGuests();
  const header =
    "name,display_name,whatsapp_number,email,invited_by,guest_location,party_size_allowed,rsvp_status,rsvp_attending_count,companion_names,rsvp_responded_at";
  const lines = guests.map((g) =>
    [
      csvEscape(g.name),
      csvEscape(g.displayName ?? ""),
      g.whatsappNumber,
      g.email ?? "",
      g.invitedBy ?? "",
      g.guestLocation ?? "",
      String(g.partySizeAllowed),
      g.rsvpStatus,
      g.rsvpAttendingCount ?? "",
      csvEscape(g.companionNames.join("; ")),
      g.rsvpRespondedAt ?? "",
    ].join(","),
  );
  return [header, ...lines].join("\n");
}

export interface SideBreakdown {
  side: InvitedBy | "sin_definir";
  total: number;
  yes: number;
  no: number;
  pending: number;
  attending: number;
}

/** Guest counts by side (novio/novia/unassigned), broken down by RSVP status — feeds the dashboard chart. */
export async function getGuestSideBreakdown(): Promise<SideBreakdown[]> {
  const guests = await listGuests();
  const sides: (InvitedBy | "sin_definir")[] = ["novio", "novia", "sin_definir"];

  return sides.map((side) => {
    const inSide = guests.filter((g) => (g.invitedBy ?? "sin_definir") === side);
    return {
      side,
      total: inSide.length,
      yes: inSide.filter((g) => g.rsvpStatus === "yes").length,
      no: inSide.filter((g) => g.rsvpStatus === "no").length,
      pending: inSide.filter((g) => g.rsvpStatus === "pending").length,
      attending: inSide.reduce((sum, g) => sum + (g.rsvpStatus === "yes" ? (g.rsvpAttendingCount ?? 0) : 0), 0),
    };
  });
}

/**
 * Builds the admin-side outbound `wa.me` link — the guest's personal RSVP URL, pre-filled in the
 * message text. Greets by `displayName` when set (a family label, e.g. "Familia Reyes Alvarado")
 * rather than the individual guest's `name`, and switches to plural phrasing only when there's
 * both a display name *and* room for others (`partySizeAllowed > 1`) — a guest with no display
 * name but a plus-one (bringing a date, not a family) stays singular, since the message is still
 * addressed to that one person.
 */
export function buildGuestInviteLink(
  guest: Pick<Guest, "name" | "displayName" | "token" | "whatsappNumber" | "partySizeAllowed">,
): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const personalUrl = `${siteUrl}/i/${guest.token}`;
  const greetingName = guest.displayName || guest.name;
  const isPlural = Boolean(guest.displayName) && guest.partySizeAllowed > 1;

  const body = isPlural
    ? "Queremos compartir con ustedes algo muy especial: su invitación a nuestra boda. Nos hará mucha ilusión tenerlos con nosotros en este día tan importante."
    : "Queremos compartir contigo algo muy especial: tu invitación a nuestra boda. Nos hará mucha ilusión tenerte con nosotros en este día tan importante.";

  const message = `${greetingName}\n\n${body}\n\nCinthia & José\n\n${personalUrl}`;
  return buildWhatsAppLink(guest.whatsappNumber, message);
}

/**
 * Builds a `wa.me` link nudging a guest who hasn't RSVP'd yet, pointing at their personal
 * `/i/[token]` page (not `/comprobante` — they haven't confirmed, so there's no comprobante to
 * resend). Same displayName/plural greeting rule as `buildGuestInviteLink`.
 */
export function buildGuestReminderLink(
  guest: Pick<Guest, "name" | "displayName" | "token" | "whatsappNumber" | "partySizeAllowed">,
): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const personalUrl = `${siteUrl}/i/${guest.token}`;
  const greetingName = guest.displayName || guest.name;
  const isPlural = Boolean(guest.displayName) && guest.partySizeAllowed > 1;

  const body = isPlural
    ? `Todavía no hemos recibido su confirmación para nuestra boda. Agradeceríamos que nos confirmen antes del ${wedding.rsvpDeadlineLabel}.`
    : `Todavía no hemos recibido tu confirmación para nuestra boda. Agradeceríamos que nos confirmes antes del ${wedding.rsvpDeadlineLabel}.`;

  const message = `${greetingName}\n\n${body}\n\nCinthia & José\n\n${personalUrl}`;
  return buildWhatsAppLink(guest.whatsappNumber, message);
}

/**
 * Builds a `wa.me` link to resend a guest's own confirmation PDF/QR (e.g. if they lost it) —
 * points at the guest-facing `/i/[token]/comprobante` re-download route. The PDF behind that link
 * contains every QR in the party (guest + companions), so the same displayName/plural rule as
 * `buildGuestInviteLink` applies: greet by family display name and go plural only when there's
 * both a display name and room for others.
 */
export function buildGuestConfirmationResendLink(
  guest: Pick<Guest, "name" | "displayName" | "token" | "whatsappNumber" | "partySizeAllowed">,
): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const comprobanteUrl = `${siteUrl}/i/${guest.token}/comprobante`;
  const greetingName = guest.displayName || guest.name;
  const isPlural = Boolean(guest.displayName) && guest.partySizeAllowed > 1;
  const verbPhrase = isPlural ? "tienen de nuevo su comprobante" : "tenés de nuevo tu comprobante";
  const message = `¡Hola ${greetingName}! Aquí ${verbPhrase} con código QR para la boda de Cinthia & José:\n${comprobanteUrl}`;
  return buildWhatsAppLink(guest.whatsappNumber, message);
}

/**
 * Same as `buildGuestConfirmationResendLink`, but for a companion — companions have no phone of
 * their own, so this still goes out through the primary guest's WhatsApp number, with the message
 * naming which person's QR it is (the PDF behind the link contains everyone's, including theirs).
 * Same displayName/plural rule as the other two guest-facing WhatsApp messages.
 */
export function buildCompanionConfirmationResendLink(
  guest: Pick<Guest, "name" | "displayName" | "token" | "whatsappNumber" | "partySizeAllowed">,
  companionName: string,
): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const comprobanteUrl = `${siteUrl}/i/${guest.token}/comprobante`;
  const greetingName = guest.displayName || guest.name;
  const isPlural = Boolean(guest.displayName) && guest.partySizeAllowed > 1;
  const verbPhrase = isPlural ? "tienen de nuevo" : "tenés de nuevo";
  const message = `¡Hola ${greetingName}! Aquí ${verbPhrase} el comprobante con el código QR de ${companionName} para la boda de Cinthia & José:\n${comprobanteUrl}`;
  return buildWhatsAppLink(guest.whatsappNumber, message);
}

/** Manual check-in toggle for the primary guest — a backup for when the QR scan fails or the door phone is offline. */
export async function setGuestCheckedIn(id: string, checkedIn: boolean): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("guests")
    .update({ checked_in: checkedIn, checked_in_at: checkedIn ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw error;
}

/** Same as `setGuestCheckedIn`, for one companion. Returns their `guest_id` so the caller can revalidate the right admin page. */
export async function setCompanionCheckedIn(companionId: string, checkedIn: boolean): Promise<string> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("guest_companions")
    .update({ checked_in: checkedIn, checked_in_at: checkedIn ? new Date().toISOString() : null })
    .eq("id", companionId)
    .select("guest_id")
    .single();
  if (error) throw error;
  return data.guest_id as string;
}

/**
 * Admin-side direct rename of a companion — independent of the name-matching sync that runs when
 * the guest themselves edits their RSVP (`apply_rsvp` in `supabase/schema.sql`). Trade-off: if the guest later
 * edits their RSVP from a page loaded before this rename, that edit's companion list still has the
 * old name, and the sync will treat it as a fresh add and lose the just-renamed row's identity.
 * Acceptable — this is an infrequent admin correction, not a common path.
 */
export async function renameCompanion(companionId: string, name: string): Promise<string> {
  const trimmed = name.trim();
  if (!trimmed) throw new GuestValidationError("El nombre no puede estar vacío.");

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("guest_companions")
    .update({ name: trimmed })
    .eq("id", companionId)
    .select("guest_id")
    .single();
  if (error) throw error;
  return data.guest_id as string;
}

/** Admin-side removal of a single companion (e.g. a duplicate or mistaken entry) — also decrements the guest's `rsvp_attending_count` so headcounts stay correct. */
export async function deleteCompanion(companionId: string): Promise<string> {
  const supabase = createSupabaseAdminClient();

  const { data: companion, error: fetchError } = await supabase
    .from("guest_companions")
    .select("guest_id")
    .eq("id", companionId)
    .single();
  if (fetchError) throw fetchError;
  const guestId = companion.guest_id as string;

  const { error: deleteError } = await supabase.from("guest_companions").delete().eq("id", companionId);
  if (deleteError) throw deleteError;

  const { data: guestRow, error: guestError } = await supabase
    .from("guests")
    .select("rsvp_attending_count")
    .eq("id", guestId)
    .single();
  if (guestError) throw guestError;

  const currentCount = guestRow.rsvp_attending_count as number | null;
  if (currentCount && currentCount > 1) {
    const { error: updateError } = await supabase
      .from("guests")
      .update({ rsvp_attending_count: currentCount - 1 })
      .eq("id", guestId);
    if (updateError) throw updateError;
  }

  return guestId;
}
