"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type DeckActionState = { message?: string; success?: string };

function text(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function errorMessage(error: unknown, fallback: string) {
  return error && typeof error === "object" && "message" in error &&
    typeof error.message === "string" && error.message.trim()
    ? error.message
    : fallback;
}

async function authenticatedClient() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  return { supabase, user: error ? null : data.user };
}

export async function createDeck(
  _state: DeckActionState,
  formData: FormData,
): Promise<DeckActionState> {
  const title = text(formData, "title");
  const description = text(formData, "description");
  const termIds = Array.from(new Set(formData.getAll("termIds")
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean)));
  if (!title || title.length > 100) return { message: "Enter a title of 100 characters or fewer." };
  if (description.length > 500) return { message: "Keep the description to 500 characters or fewer." };
  if (termIds.length === 0) return { message: "Add at least one term to your deck." };
  if (termIds.length > 500) return { message: "Create decks with 500 terms or fewer." };

  const { supabase, user } = await authenticatedClient();
  if (!user) return { message: "Sign in again before creating a deck." };
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name,username")
    .eq("id", user.id)
    .maybeSingle();
  const creator = profile?.display_name || profile?.username || "Jingdex user";
  const { data: existingTerms, error: termsError } = await supabase
    .from("terms").select("id").in("id", termIds);
  if (termsError) return { message: errorMessage(termsError, "Could not check the selected terms.") };
  const existingIds = new Set((existingTerms ?? []).map((term) => term.id));
  if (termIds.some((termId) => !existingIds.has(termId))) {
    return { message: "One or more selected terms could not be found. Search again and retry." };
  }

  const { data: deck, error } = await supabase.from("decks").insert({
    title,
    description: description || null,
    created_by: creator,
    created_by_user_id: user.id,
    visibility: "private",
    publication_status: "draft",
  }).select("id").single();
  if (error || !deck) return { message: errorMessage(error, "Could not create that deck.") };
  const { error: deckTermsError } = await supabase.from("deck_terms").insert(
    termIds.map((termId, position) => ({ deck_id: deck.id, term_id: termId, position })),
  );
  if (deckTermsError) {
    await supabase.from("decks").delete().eq("id", deck.id).eq("created_by_user_id", user.id);
    return { message: errorMessage(deckTermsError, "Could not add terms to that deck.") };
  }
  revalidatePath("/my-stuff/decks");
  return { success: `Deck created with ${termIds.length} ${termIds.length === 1 ? "term" : "terms"}.` };
}

export async function updateDeck(
  _state: DeckActionState,
  formData: FormData,
): Promise<DeckActionState> {
  const id = text(formData, "id");
  const title = text(formData, "title");
  const description = text(formData, "description");
  if (!id) return { message: "Choose a deck to update." };
  if (!title || title.length > 100) return { message: "Enter a title of 100 characters or fewer." };
  if (description.length > 500) return { message: "Keep the description to 500 characters or fewer." };

  const { supabase, user } = await authenticatedClient();
  if (!user) return { message: "Sign in again before updating a deck." };
  const { data, error } = await supabase
    .from("decks")
    .update({ title, description: description || null })
    .eq("id", id)
    .eq("created_by_user_id", user.id)
    .eq("visibility", "private")
    .select("id")
    .maybeSingle();
  if (error) return { message: errorMessage(error, "Could not update that deck.") };
  if (!data) return { message: "That private deck could not be found." };
  revalidatePath("/my-stuff/decks");
  return { success: "Deck updated." };
}

export async function updateDeckTerms(
  _state: DeckActionState,
  formData: FormData,
): Promise<DeckActionState> {
  const id = text(formData, "id");
  const termIds = Array.from(new Set(formData.getAll("termIds")
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim()).filter(Boolean)));
  if (!id) return { message: "Choose a deck to update." };
  if (termIds.length === 0) return { message: "Keep at least one term in your deck." };
  if (termIds.length > 500) return { message: "Keep decks to 500 terms or fewer." };

  const { supabase, user } = await authenticatedClient();
  if (!user) return { message: "Sign in again before updating a deck." };
  const { data: deck } = await supabase.from("decks").select("id")
    .eq("id", id).eq("created_by_user_id", user.id).eq("visibility", "private").maybeSingle();
  if (!deck) return { message: "That private deck could not be found." };

  const { data: existingTerms, error: termsError } = await supabase.from("terms").select("id").in("id", termIds);
  if (termsError) return { message: errorMessage(termsError, "Could not check the selected terms.") };
  const existingIds = new Set((existingTerms ?? []).map((term) => term.id));
  if (termIds.some((termId) => !existingIds.has(termId))) return { message: "One or more selected terms could not be found." };

  const { error: upsertError } = await supabase.from("deck_terms").upsert(
    termIds.map((termId, position) => ({ deck_id: id, term_id: termId, position })),
    { onConflict: "deck_id,term_id" },
  );
  if (upsertError) return { message: errorMessage(upsertError, "Could not reorder those terms.") };
  const keepIds = `(${termIds.join(",")})`;
  const { error: deleteError } = await supabase.from("deck_terms").delete()
    .eq("deck_id", id).not("term_id", "in", keepIds);
  if (deleteError) return { message: errorMessage(deleteError, "Could not remove terms from that deck.") };
  revalidatePath("/my-stuff/decks");
  revalidatePath(`/my-stuff/decks/${id}`);
  return { success: "Deck terms updated." };
}

export async function deleteDeck(
  _state: DeckActionState,
  formData: FormData,
): Promise<DeckActionState> {
  const id = text(formData, "id");
  if (!id) return { message: "Choose a deck to delete." };
  const { supabase, user } = await authenticatedClient();
  if (!user) return { message: "Sign in again before deleting a deck." };
  const { data, error } = await supabase
    .from("decks")
    .delete()
    .eq("id", id)
    .eq("created_by_user_id", user.id)
    .eq("visibility", "private")
    .select("id")
    .maybeSingle();
  if (error) return { message: errorMessage(error, "Could not delete that deck.") };
  if (!data) return { message: "That private deck could not be found." };
  revalidatePath("/my-stuff/decks");
  return { success: "Deck deleted." };
}
