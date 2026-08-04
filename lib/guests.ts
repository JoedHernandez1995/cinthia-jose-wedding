import "server-only";
import { randomBytes } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { sendGuestConfirmation } from "@/lib/confirmation";
import type {
  CsvRowError,
  CsvUploadResult,
  Guest,
  GuestCompanion,
  GuestCsvRow,
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
  party_size_allowed: number;
  invite_sent: boolean;
  invite_sent_at: string | null;
  rsvp_status: RsvpStatus;
  rsvp_attending_count: number | null;
  rsvp_responded_at: string | null;
  confirmation_sent_at: string | null;
  confirmation_send_error: string | null;
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
}

function mapCompanionRow(row: GuestCompanionRow): GuestCompanion {
  return { id: row.id, name: row.name, checkinCode: row.checkin_code };
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
    partySizeAllowed: row.party_size_allowed,
    inviteSent: row.invite_sent,
    inviteSentAt: row.invite_sent_at,
    rsvpStatus: row.rsvp_status,
    rsvpAttendingCount: row.rsvp_attending_count,
    companionNames: companions.map((c) => c.name),
    companions,
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
    .select("id, guest_id, name, checkin_code, position")
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
    .select("id, guest_id, name, checkin_code, position")
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
      party_size_allowed: input.partySizeAllowed,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    if (isDuplicateKeyError(error)) {
      throw new DuplicateGuestError(`Ya existe otro invitado con el nombre y número "${input.name}".`);
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

/**
 * Reconciles a guest's companion rows with a new name list, matched by
 * normalized (trim+lowercase) name so an unchanged companion keeps their
 * `id`/`checkinCode` across edits. Trade-off: fixing a typo in a companion's
 * name on a later edit is treated as remove+add (that person's QR code
 * regenerates) rather than persisting through a rename — simpler than
 * threading stable ids through the RSVP modal's plain `string[]`, which has
 * no other reason to need them.
 */
async function syncGuestCompanions(guestId: string, names: string[]): Promise<GuestCompanion[]> {
  const supabase = createSupabaseAdminClient();
  const existing = await fetchCompanions(guestId);
  const normalize = (s: string) => s.trim().toLowerCase();

  const claimed = new Set<string>();
  const result: (GuestCompanion | undefined)[] = [];
  const toInsert: { name: string; position: number }[] = [];

  names.forEach((name, position) => {
    const match = existing.find((e) => !claimed.has(e.id) && normalize(e.name) === normalize(name));
    if (match) {
      claimed.add(match.id);
      result[position] = { id: match.id, name, checkinCode: match.checkinCode };
    } else {
      toInsert.push({ name, position });
    }
  });

  const idsToDelete = existing.filter((e) => !claimed.has(e.id)).map((e) => e.id);
  if (idsToDelete.length > 0) {
    const { error } = await supabase.from("guest_companions").delete().in("id", idsToDelete);
    if (error) throw error;
  }

  for (const [position, entry] of result.entries()) {
    if (entry && entry.name !== names[position]) {
      const { error } = await supabase.from("guest_companions").update({ name: names[position] }).eq("id", entry.id);
      if (error) throw error;
    }
  }

  if (toInsert.length > 0) {
    const { data: inserted, error } = await supabase
      .from("guest_companions")
      .insert(toInsert.map((r) => ({ guest_id: guestId, name: r.name, position: r.position })))
      .select("id, guest_id, name, checkin_code, position");
    if (error) throw error;
    for (const row of inserted as GuestCompanionRow[]) {
      result[row.position] = mapCompanionRow(row);
    }
  }

  return result.filter((c): c is GuestCompanion => Boolean(c));
}

/** Used on a "no" RSVP — revokes all of this guest's companion check-in codes; nothing to check in. */
async function clearGuestCompanions(guestId: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("guest_companions").delete().eq("guest_id", guestId);
  if (error) throw error;
}

export class RsvpValidationError extends Error {}

/** Validates against `partySizeAllowed` server-side (never trust a client-sent count) and persists the response. */
export async function submitRsvp(token: string, input: SubmitRsvpInput): Promise<{ guest: Guest; confirmationSent: boolean }> {
  const guest = await getGuestByToken(token);
  if (!guest) throw new RsvpValidationError("Invitado no encontrado.");

  const companionNames = input.status === "yes" ? input.companionNames.map((n) => n.trim()).filter(Boolean) : [];
  const maxCompanions = guest.partySizeAllowed - 1;

  if (companionNames.length > maxCompanions) {
    throw new RsvpValidationError(`Tu invitación es válida para ${guest.partySizeAllowed} persona(s) en total.`);
  }

  const email = input.email?.trim() ?? "";
  if (input.status === "yes" && !EMAIL_RE.test(email)) {
    throw new RsvpValidationError("Ingresa un correo electrónico válido para recibir tu confirmación.");
  }

  const attendingCount = input.status === "yes" ? 1 + companionNames.length : null;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("guests")
    .update({
      rsvp_status: input.status,
      rsvp_attending_count: attendingCount,
      email: email || guest.email,
      rsvp_responded_at: new Date().toISOString(),
    })
    .eq("token", token)
    .select("*")
    .single();
  if (error) throw error;

  const companions =
    input.status === "yes" ? await syncGuestCompanions(guest.id, companionNames) : (await clearGuestCompanions(guest.id), []);

  const updatedGuest = mapRow(data as GuestRow, companions);

  // Runs strictly after the RSVP save above has already committed; never
  // throws, so a PDF/email failure can never roll back or block the save.
  const confirmationSent = input.status === "yes" ? await sendGuestConfirmation(updatedGuest) : false;

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

    rows.push({ name, displayName, whatsappNumber: phoneDigits, invitedBy, partySizeAllowed });
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

  // invited_by/display_name are only written when the CSV row explicitly
  // specifies them, via separate targeted updates — so a re-upload with
  // those columns blank never silently clears a value set later via the
  // admin edit form.
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

/** Admin manual override — sets RSVP status directly by guest id, bypassing token lookup. Same validation as the guest-facing form, but email is optional (guests who respond off-platform may have none on file). */
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

  const attendingCount = input.status === "yes" ? 1 + companionNames.length : null;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("guests")
    .update({
      rsvp_status: input.status,
      rsvp_attending_count: attendingCount,
      email: email || guest.email,
      rsvp_responded_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;

  const companions =
    input.status === "yes" ? await syncGuestCompanions(id, companionNames) : (await clearGuestCompanions(id), []);

  const updatedGuest = mapRow(data as GuestRow, companions);
  const confirmationSent = input.status === "yes" ? await sendGuestConfirmation(updatedGuest) : false;

  return { guest: updatedGuest, confirmationSent };
}

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Builds a CSV of every guest's current RSVP state — for the caterer/venue headcount. */
export async function exportGuestsCsv(): Promise<string> {
  const guests = await listGuests();
  const header =
    "name,display_name,whatsapp_number,email,invited_by,party_size_allowed,rsvp_status,rsvp_attending_count,companion_names,rsvp_responded_at";
  const lines = guests.map((g) =>
    [
      csvEscape(g.name),
      csvEscape(g.displayName ?? ""),
      g.whatsappNumber,
      g.email ?? "",
      g.invitedBy ?? "",
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

/** Builds the admin-side outbound `wa.me` link — the guest's personal RSVP URL, pre-filled in the message text. */
export function buildGuestInviteLink(guest: Pick<Guest, "name" | "token" | "whatsappNumber">): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const personalUrl = `${siteUrl}/i/${guest.token}`;
  const message = `¡Hola ${guest.name}! 💌\n\nTe compartimos tu invitación personal a la boda de José & Cinthia:\n${personalUrl}`;
  return buildWhatsAppLink(guest.whatsappNumber, message);
}
