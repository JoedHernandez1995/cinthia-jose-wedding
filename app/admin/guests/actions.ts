"use server";

import Papa from "papaparse";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  DuplicateGuestError,
  GuestValidationError,
  createGuest,
  deleteGuest,
  markInviteSent,
  overrideRsvp,
  parseGuestCsvRows,
  regenerateToken,
  updateGuest,
  upsertGuestsFromCsv,
} from "@/lib/guests";
import type { CsvUploadResult, InvitedBy, RsvpStatus } from "@/types/guest";

function parseInvitedBy(raw: FormDataEntryValue | null): InvitedBy | null {
  const value = String(raw ?? "");
  return value === "novio" || value === "novia" ? value : null;
}

const MAX_ENCODED_ERRORS = 20;

function redirectWithResult(result: CsvUploadResult) {
  const trimmed: CsvUploadResult = { ...result, skipped: result.skipped.slice(0, MAX_ENCODED_ERRORS) };
  redirect(`/admin/guests?uploadResult=${encodeURIComponent(JSON.stringify(trimmed))}`);
}

export async function uploadGuestsCsv(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirectWithResult({ inserted: 0, updated: 0, skipped: [{ row: 0, reason: "No se seleccionó ningún archivo." }] });
    return;
  }

  const text = await file.text();
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  const { rows, errors } = parseGuestCsvRows(parsed.data);

  const { inserted, updated } = await upsertGuestsFromCsv(rows);

  revalidatePath("/admin/guests");
  redirectWithResult({ inserted, updated, skipped: errors });
}

export async function addSingleGuest(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const displayName = String(formData.get("displayName") ?? "").trim() || null;
  const whatsappNumber = String(formData.get("whatsappNumber") ?? "").replace(/\D/g, "");
  const partySizeAllowed = Number(formData.get("partySizeAllowed") ?? 1);
  const invitedBy = parseInvitedBy(formData.get("invitedBy"));

  if (name && whatsappNumber) {
    try {
      await createGuest({
        name,
        displayName,
        whatsappNumber,
        invitedBy,
        partySizeAllowed: Number.isFinite(partySizeAllowed) && partySizeAllowed >= 1 ? partySizeAllowed : 1,
      });
    } catch (error) {
      if (error instanceof DuplicateGuestError) {
        revalidatePath("/admin/guests");
        redirect(`/admin/guests?addError=${encodeURIComponent(error.message)}`);
      }
      throw error;
    }
  }

  revalidatePath("/admin/guests");
  redirect("/admin/guests");
}

export async function editGuestAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const displayName = String(formData.get("displayName") ?? "").trim() || null;
  const whatsappNumber = String(formData.get("whatsappNumber") ?? "").replace(/\D/g, "");
  const partySizeAllowed = Number(formData.get("partySizeAllowed") ?? 1);
  const invitedBy = parseInvitedBy(formData.get("invitedBy"));

  if (id && name && whatsappNumber) {
    try {
      await updateGuest(id, {
        name,
        displayName,
        whatsappNumber,
        invitedBy,
        partySizeAllowed: Number.isFinite(partySizeAllowed) && partySizeAllowed >= 1 ? partySizeAllowed : 1,
      });
    } catch (error) {
      if (error instanceof DuplicateGuestError || error instanceof GuestValidationError) {
        redirect(`/admin/guests/${id}?editError=${encodeURIComponent(error.message)}`);
      }
      throw error;
    }
  }

  revalidatePath("/admin/guests");
  revalidatePath(`/admin/guests/${id}`);
  redirect(`/admin/guests/${id}`);
}

export async function deleteGuestAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (id) await deleteGuest(id);
  revalidatePath("/admin/guests");
}

export async function markInviteSentAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (id) await markInviteSent(id);
  revalidatePath("/admin/guests");
}

export async function regenerateTokenAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (id) await regenerateToken(id);
  revalidatePath("/admin/guests");
}

export async function overrideRsvpAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as RsvpStatus;
  const email = String(formData.get("email") ?? "").trim();
  const companionNamesRaw = String(formData.get("companionNames") ?? "");
  const companionNames = companionNamesRaw
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean);

  if (id && (status === "yes" || status === "no")) {
    await overrideRsvp(id, { status, email: email || undefined, companionNames });
  }

  revalidatePath("/admin/guests");
  revalidatePath(`/admin/guests/${id}`);
}
