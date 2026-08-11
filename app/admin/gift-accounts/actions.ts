"use server";

import { revalidatePath } from "next/cache";
import { createGiftAccount, deleteGiftAccount, updateGiftAccount } from "@/lib/content";
import type { GiftAccountAudience } from "@/types/invitation";

export interface ActionResult {
  ok: boolean;
  message: string;
}

function parseAudience(raw: FormDataEntryValue | null): GiftAccountAudience {
  return String(raw ?? "") === "abroad" ? "abroad" : "local";
}

export async function addGiftAccountAction(_prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const audience = parseAudience(formData.get("audience"));
  const label = String(formData.get("label") ?? "").trim();
  const primaryLine = String(formData.get("primaryLine") ?? "").trim();
  const secondaryLine = String(formData.get("secondaryLine") ?? "").trim();
  const copyText = String(formData.get("copyText") ?? "").trim();

  if (!label || !primaryLine || !copyText) {
    return { ok: false, message: "Completa al menos el título, la línea principal y el texto a copiar." };
  }

  await createGiftAccount({ audience, label, primaryLine, secondaryLine: secondaryLine || undefined, copyText });
  revalidatePath("/admin/gift-accounts");
  return { ok: true, message: "Cuenta agregada." };
}

export async function editGiftAccountAction(_prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const id = String(formData.get("id") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const primaryLine = String(formData.get("primaryLine") ?? "").trim();
  const secondaryLine = String(formData.get("secondaryLine") ?? "").trim();
  const copyText = String(formData.get("copyText") ?? "").trim();

  if (!id || !label || !primaryLine || !copyText) {
    return { ok: false, message: "Completa al menos el título, la línea principal y el texto a copiar." };
  }

  await updateGiftAccount(id, { label, primaryLine, secondaryLine: secondaryLine || undefined, copyText });
  revalidatePath("/admin/gift-accounts");
  return { ok: true, message: "Cuenta actualizada." };
}

export async function deleteGiftAccountAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (id) await deleteGiftAccount(id);
  revalidatePath("/admin/gift-accounts");
}
