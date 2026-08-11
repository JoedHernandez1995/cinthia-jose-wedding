import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  GiftAccount,
  GiftAccountAudience,
  RecommendationCategory,
  RecommendationCategoryId,
  RecommendationEntry,
} from "@/types/invitation";

const recommendationCategoryTitles: Record<RecommendationCategoryId, string> = {
  hospedaje: "Hospedaje",
  belleza: "Cabello y Maquillaje",
  trajes: "Alquiler de Trajes y Vestidos",
};

interface GiftAccountRow {
  id: string;
  audience: GiftAccountAudience;
  label: string;
  primary_line: string;
  secondary_line: string | null;
  copy_text: string;
  position: number;
}

function mapGiftAccountRow(row: GiftAccountRow): GiftAccount {
  return {
    id: row.id,
    audience: row.audience,
    label: row.label,
    primaryLine: row.primary_line,
    secondaryLine: row.secondary_line ?? undefined,
    copyText: row.copy_text,
  };
}

export async function getGiftAccounts(audience: GiftAccountAudience): Promise<GiftAccount[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("gift_accounts")
    .select("id, audience, label, primary_line, secondary_line, copy_text, position")
    .eq("audience", audience)
    .order("position");
  if (error) throw error;
  return (data as GiftAccountRow[]).map(mapGiftAccountRow);
}

export interface GiftAccountInput {
  audience: GiftAccountAudience;
  label: string;
  primaryLine: string;
  secondaryLine?: string;
  copyText: string;
}

export async function createGiftAccount(input: GiftAccountInput): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { data: existing, error: maxError } = await supabase
    .from("gift_accounts")
    .select("position")
    .eq("audience", input.audience)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (maxError) throw maxError;
  const nextPosition = existing ? existing.position + 1 : 0;

  const { error } = await supabase.from("gift_accounts").insert({
    audience: input.audience,
    label: input.label,
    primary_line: input.primaryLine,
    secondary_line: input.secondaryLine || null,
    copy_text: input.copyText,
    position: nextPosition,
  });
  if (error) throw error;
}

export async function updateGiftAccount(id: string, input: Omit<GiftAccountInput, "audience">): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("gift_accounts")
    .update({
      label: input.label,
      primary_line: input.primaryLine,
      secondary_line: input.secondaryLine || null,
      copy_text: input.copyText,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteGiftAccount(id: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("gift_accounts").delete().eq("id", id);
  if (error) throw error;
}

interface RecommendationEntryRow {
  id: string;
  category: RecommendationCategoryId;
  name: string;
  description: string | null;
  maps_link: string | null;
  phone: string | null;
  link: string | null;
  position: number;
}

function mapRecommendationEntryRow(row: RecommendationEntryRow): RecommendationEntry {
  return {
    id: row.id,
    category: row.category,
    name: row.name,
    description: row.description ?? undefined,
    mapsLink: row.maps_link ?? undefined,
    phone: row.phone ?? undefined,
    link: row.link ?? undefined,
  };
}

/** All 3 fixed categories, always returned in the same order, each with its entries ordered by position. */
export async function getRecommendationCategories(): Promise<RecommendationCategory[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("recommendation_entries")
    .select("id, category, name, description, maps_link, phone, link, position")
    .order("category")
    .order("position");
  if (error) throw error;

  const rows = data as RecommendationEntryRow[];
  const categoryIds: RecommendationCategoryId[] = ["hospedaje", "belleza", "trajes"];
  return categoryIds.map((id) => ({
    id,
    title: recommendationCategoryTitles[id],
    entries: rows.filter((r) => r.category === id).map(mapRecommendationEntryRow),
  }));
}

export interface RecommendationEntryInput {
  category: RecommendationCategoryId;
  name: string;
  description?: string;
  mapsLink?: string;
  phone?: string;
  link?: string;
}

export async function createRecommendationEntry(input: RecommendationEntryInput): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { data: existing, error: maxError } = await supabase
    .from("recommendation_entries")
    .select("position")
    .eq("category", input.category)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (maxError) throw maxError;
  const nextPosition = existing ? existing.position + 1 : 0;

  const { error } = await supabase.from("recommendation_entries").insert({
    category: input.category,
    name: input.name,
    description: input.description || null,
    maps_link: input.mapsLink || null,
    phone: input.phone || null,
    link: input.link || null,
    position: nextPosition,
  });
  if (error) throw error;
}

export async function updateRecommendationEntry(id: string, input: Omit<RecommendationEntryInput, "category">): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("recommendation_entries")
    .update({
      name: input.name,
      description: input.description || null,
      maps_link: input.mapsLink || null,
      phone: input.phone || null,
      link: input.link || null,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteRecommendationEntry(id: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("recommendation_entries").delete().eq("id", id);
  if (error) throw error;
}
