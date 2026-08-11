"use server";

import { revalidatePath } from "next/cache";
import { createRecommendationEntry, deleteRecommendationEntry, updateRecommendationEntry } from "@/lib/content";
import type { RecommendationCategoryId } from "@/types/invitation";

export interface ActionResult {
  ok: boolean;
  message: string;
}

const CATEGORY_IDS: RecommendationCategoryId[] = ["hospedaje", "belleza", "trajes"];

function parseCategory(raw: FormDataEntryValue | null): RecommendationCategoryId {
  const value = String(raw ?? "");
  return (CATEGORY_IDS as string[]).includes(value) ? (value as RecommendationCategoryId) : "hospedaje";
}

export async function addRecommendationEntryAction(_prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const category = parseCategory(formData.get("category"));
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const mapsLink = String(formData.get("mapsLink") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const link = String(formData.get("link") ?? "").trim();

  if (!name) {
    return { ok: false, message: "El nombre es obligatorio." };
  }

  await createRecommendationEntry({
    category,
    name,
    description: description || undefined,
    mapsLink: mapsLink || undefined,
    phone: phone || undefined,
    link: link || undefined,
  });
  revalidatePath("/admin/recommendations");
  revalidatePath("/i/[token]/recomendaciones", "page");
  return { ok: true, message: "Recomendación agregada." };
}

export async function editRecommendationEntryAction(_prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const mapsLink = String(formData.get("mapsLink") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const link = String(formData.get("link") ?? "").trim();

  if (!id || !name) {
    return { ok: false, message: "El nombre es obligatorio." };
  }

  await updateRecommendationEntry(id, {
    name,
    description: description || undefined,
    mapsLink: mapsLink || undefined,
    phone: phone || undefined,
    link: link || undefined,
  });
  revalidatePath("/admin/recommendations");
  revalidatePath("/i/[token]/recomendaciones", "page");
  return { ok: true, message: "Recomendación actualizada." };
}

export async function deleteRecommendationEntryAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (id) await deleteRecommendationEntry(id);
  revalidatePath("/admin/recommendations");
  revalidatePath("/i/[token]/recomendaciones", "page");
}
