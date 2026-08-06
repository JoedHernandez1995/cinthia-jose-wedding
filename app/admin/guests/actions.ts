"use server";

import Papa from "papaparse";
import { revalidatePath } from "next/cache";
import {
  DuplicateGuestError,
  GuestValidationError,
  RsvpValidationError,
  bulkMarkInviteSent,
  createGuest,
  deleteCompanion,
  deleteGuest,
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
import type { CsvUploadResult, GuestLocation, InvitedBy, RsvpStatus } from "@/types/guest";

function parseInvitedBy(raw: FormDataEntryValue | null): InvitedBy | null {
  const value = String(raw ?? "");
  return value === "novio" || value === "novia" ? value : null;
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

export async function overrideRsvpAction(_prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as RsvpStatus;
  const email = String(formData.get("email") ?? "").trim();
  const companionNamesRaw = String(formData.get("companionNames") ?? "");
  const companionNames = companionNamesRaw
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean);

  if (!id || (status !== "yes" && status !== "no")) {
    return { ok: false, message: "Selecciona un estado válido." };
  }

  try {
    await overrideRsvp(id, { status, email: email || undefined, companionNames });
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
