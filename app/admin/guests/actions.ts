"use server";

import Papa from "papaparse";
import { revalidatePath } from "next/cache";
import {
  DuplicateGuestError,
  GuestValidationError,
  RsvpValidationError,
  bulkDeclinePendingGuests,
  bulkMarkInviteSent,
  bulkSetInvitedBy,
  createGuest,
  deleteCompanion,
  deleteGuest,
  getGuestById,
  markInviteSent,
  overrideRsvp,
  parseGuestCsvRows,
  regenerateToken,
  renameCompanion,
  setCompanionCheckedIn,
  setGuestCheckedIn,
  updateGuest,
  upsertGuestsFromCsv,
} from "@/lib/guests";
import { sendGuestReminder } from "@/lib/reminder";
import { isClosureNoticeEligible, sendGuestClosureNotice } from "@/lib/closureNotice";
import type { CsvUploadResult, GuestLocation, InvitedBy, RsvpStatus } from "@/types/guest";

const INVITED_BY_VALUES: InvitedBy[] = ["novio", "novia", "padres_novio", "padres_novia"];

function parseInvitedBy(raw: FormDataEntryValue | null): InvitedBy | null {
  const value = String(raw ?? "");
  return (INVITED_BY_VALUES as string[]).includes(value) ? (value as InvitedBy) : null;
}

function parseGuestLocation(raw: FormDataEntryValue | null): GuestLocation | null {
  const value = String(raw ?? "");
  return value === "local" || value === "extranjero" ? value : null;
}

export interface ActionResult {
  ok: boolean;
  message: string;
}

export async function uploadGuestsCsv(_prevState: CsvUploadResult | null, formData: FormData): Promise<CsvUploadResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { inserted: 0, updated: 0, skipped: [{ row: 0, reason: "No se seleccionó ningún archivo." }] };
  }

  const text = await file.text();
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  const { rows, errors } = parseGuestCsvRows(parsed.data);

  const { inserted, updated } = await upsertGuestsFromCsv(rows);

  revalidatePath("/admin/guests");
  return { inserted, updated, skipped: errors };
}

export async function addSingleGuest(_prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const displayName = String(formData.get("displayName") ?? "").trim() || null;
  const whatsappNumber = String(formData.get("whatsappNumber") ?? "").replace(/\D/g, "");
  const partySizeAllowed = Number(formData.get("partySizeAllowed") ?? 1);
  const invitedBy = parseInvitedBy(formData.get("invitedBy"));
  const guestLocation = parseGuestLocation(formData.get("guestLocation"));

  if (!name || !whatsappNumber) {
    return { ok: false, message: "El nombre y el número de WhatsApp son obligatorios." };
  }

  try {
    await createGuest({
      name,
      displayName,
      whatsappNumber,
      invitedBy,
      guestLocation,
      partySizeAllowed: Number.isFinite(partySizeAllowed) && partySizeAllowed >= 1 ? partySizeAllowed : 1,
    });
  } catch (error) {
    if (error instanceof DuplicateGuestError) {
      return { ok: false, message: error.message };
    }
    throw error;
  }

  revalidatePath("/admin/guests");
  return { ok: true, message: `${name} fue agregado.` };
}

export async function editGuestAction(_prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const displayName = String(formData.get("displayName") ?? "").trim() || null;
  const whatsappNumber = String(formData.get("whatsappNumber") ?? "").replace(/\D/g, "");
  const partySizeAllowed = Number(formData.get("partySizeAllowed") ?? 1);
  const invitedBy = parseInvitedBy(formData.get("invitedBy"));
  const guestLocation = parseGuestLocation(formData.get("guestLocation"));

  if (!id || !name || !whatsappNumber) {
    return { ok: false, message: "El nombre y el número de WhatsApp son obligatorios." };
  }

  try {
    await updateGuest(id, {
      name,
      displayName,
      whatsappNumber,
      invitedBy,
      guestLocation,
      partySizeAllowed: Number.isFinite(partySizeAllowed) && partySizeAllowed >= 1 ? partySizeAllowed : 1,
    });
  } catch (error) {
    if (error instanceof DuplicateGuestError || error instanceof GuestValidationError) {
      return { ok: false, message: error.message };
    }
    throw error;
  }

  revalidatePath("/admin/guests");
  revalidatePath(`/admin/guests/${id}`);
  return { ok: true, message: "Cambios guardados." };
}

export async function deleteGuestAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (id) await deleteGuest(id);
  revalidatePath("/admin/guests");
}

export async function markInviteSentAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (id) await markInviteSent(id);
  revalidatePath("/admin/guests");
}

export async function bulkMarkInviteSentAction(formData: FormData): Promise<void> {
  const ids = String(formData.get("ids") ?? "")
    .split(",")
    .filter(Boolean);
  if (ids.length === 0) return;
  await bulkMarkInviteSent(ids);
  revalidatePath("/admin/guests");
}

export async function bulkSetInvitedByAction(formData: FormData): Promise<void> {
  const ids = String(formData.get("ids") ?? "")
    .split(",")
    .filter(Boolean);
  if (ids.length === 0) return;
  const invitedBy = parseInvitedBy(formData.get("invitedBy"));
  await bulkSetInvitedBy(ids, invitedBy);
  revalidatePath("/admin/guests");
}

/**
 * End-of-campaign cleanup: bulk-declares still-pending guests (viewed or not) as "no asistirá".
 * Unlike the other bulk actions above, this one reports how many succeeded/failed, since routing
 * each guest through `overrideRsvp` means an individual guest can fail validation (e.g. already
 * confirmed by the time this runs) without the whole batch failing.
 */
export async function bulkDeclinePendingGuestsAction(formData: FormData): Promise<ActionResult> {
  const ids = String(formData.get("ids") ?? "")
    .split(",")
    .filter(Boolean);
  if (ids.length === 0) return { ok: false, message: "No hay invitados seleccionados." };

  const { succeeded, failed } = await bulkDeclinePendingGuests(ids);
  revalidatePath("/admin/guests");
  return failed === 0
    ? { ok: true, message: `${succeeded} invitado(s) marcado(s) como "no asistirá".` }
    : { ok: true, message: `${succeeded} invitado(s) marcado(s) como "no asistirá", ${failed} con error.` };
}

/**
 * Single-guest version of the above — backs the per-row "Marcar como no asistirá" button for a
 * still-pending guest once the RSVP window has closed.
 */
export async function declineNoShowGuestAction(formData: FormData): Promise<ActionResult> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, message: "Falta el invitado." };

  const guest = await getGuestById(id);
  if (!guest) return { ok: false, message: "Invitado no encontrado." };
  if (guest.rsvpStatus !== "pending") {
    return { ok: false, message: `${guest.name} ya respondió.` };
  }

  try {
    await overrideRsvp(id, { status: "no", companionNames: [], primaryAttending: true });
  } catch (error) {
    if (error instanceof RsvpValidationError) {
      return { ok: false, message: error.message };
    }
    throw error;
  }

  revalidatePath("/admin/guests");
  revalidatePath(`/admin/guests/${id}`);
  return { ok: true, message: `${guest.name} marcado como "no asistirá".` };
}

export async function regenerateTokenAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (id) await regenerateToken(id);
  revalidatePath("/admin/guests");
}

export async function toggleGuestCheckedInAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const checkedIn = String(formData.get("checkedIn")) === "true";
  if (!id) return;
  await setGuestCheckedIn(id, checkedIn);
  revalidatePath("/admin/guests");
  revalidatePath(`/admin/guests/${id}`);
}

export async function toggleCompanionCheckedInAction(formData: FormData): Promise<void> {
  const companionId = String(formData.get("companionId") ?? "");
  const checkedIn = String(formData.get("checkedIn")) === "true";
  if (!companionId) return;
  const guestId = await setCompanionCheckedIn(companionId, checkedIn);
  revalidatePath("/admin/guests");
  revalidatePath(`/admin/guests/${guestId}`);
}

export async function renameCompanionAction(formData: FormData): Promise<ActionResult> {
  const companionId = String(formData.get("companionId") ?? "");
  const name = String(formData.get("name") ?? "");
  if (!companionId) return { ok: false, message: "Falta el acompañante." };

  try {
    const guestId = await renameCompanion(companionId, name);
    revalidatePath("/admin/guests");
    revalidatePath(`/admin/guests/${guestId}`);
  } catch (error) {
    if (error instanceof GuestValidationError) {
      return { ok: false, message: error.message };
    }
    throw error;
  }

  return { ok: true, message: "Nombre actualizado." };
}

export async function deleteCompanionAction(formData: FormData): Promise<void> {
  const companionId = String(formData.get("companionId") ?? "");
  if (!companionId) return;
  const guestId = await deleteCompanion(companionId);
  revalidatePath("/admin/guests");
  revalidatePath(`/admin/guests/${guestId}`);
}

/**
 * Sends a single "please RSVP" reminder email. Called both from the per-row button and, once per
 * selected guest, from the bulk reminder queue's client-side loop — Server Actions have no
 * built-in way to stream progress for a server-side loop over many guests, so the fan-out lives
 * in the client instead (see `BulkReminderQueue.tsx`).
 */
export async function sendReminderEmailAction(formData: FormData): Promise<ActionResult> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, message: "Falta el invitado." };

  const guest = await getGuestById(id);
  if (!guest) return { ok: false, message: "Invitado no encontrado." };
  if (!guest.email) return { ok: false, message: `${guest.name} no tiene correo registrado.` };
  if (guest.rsvpStatus !== "pending" || guest.viewCount <= 0) {
    return { ok: false, message: `${guest.name} no califica para un recordatorio por correo.` };
  }

  const sent = await sendGuestReminder(guest);
  revalidatePath("/admin/guests");
  revalidatePath(`/admin/guests/${id}`);
  return sent
    ? { ok: true, message: `Recordatorio enviado a ${guest.name}.` }
    : { ok: false, message: `No se pudo enviar el recordatorio a ${guest.name}.` };
}

/**
 * Sends the one-time "the RSVP window closed" email. Called both from the per-row button and,
 * once per selected guest, from the bulk closure-notice queue's client-side loop — same reasoning
 * as `sendReminderEmailAction` above for why the fan-out lives client-side.
 */
export async function sendClosureNoticeEmailAction(formData: FormData): Promise<ActionResult> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, message: "Falta el invitado." };

  const guest = await getGuestById(id);
  if (!guest) return { ok: false, message: "Invitado no encontrado." };
  if (!isClosureNoticeEligible(guest)) {
    return { ok: false, message: `${guest.name} no califica para el aviso de cierre.` };
  }

  const sent = await sendGuestClosureNotice(guest);
  revalidatePath("/admin/guests");
  revalidatePath(`/admin/guests/${id}`);
  return sent
    ? { ok: true, message: `Aviso de cierre enviado a ${guest.name}.` }
    : { ok: false, message: `No se pudo enviar el aviso de cierre a ${guest.name}.` };
}

export async function overrideRsvpAction(_prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as RsvpStatus;
  const email = String(formData.get("email") ?? "").trim();
  const primaryAttending = String(formData.get("primaryAttending") ?? "yes") !== "no";
  const companionNamesRaw = String(formData.get("companionNames") ?? "");
  const companionNames = companionNamesRaw
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean);

  if (!id || (status !== "yes" && status !== "no")) {
    return { ok: false, message: "Selecciona un estado válido." };
  }

  try {
    await overrideRsvp(id, { status, email: email || undefined, companionNames, primaryAttending });
  } catch (error) {
    if (error instanceof RsvpValidationError) {
      return { ok: false, message: error.message };
    }
    throw error;
  }

  revalidatePath("/admin/guests");
  revalidatePath(`/admin/guests/${id}`);
  return { ok: true, message: "Respuesta actualizada." };
}
