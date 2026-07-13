"use server";

import { revalidatePath } from "next/cache";
import { hasPermission } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export type DeckReviewActionState = { message?: string; success?: string };

function value(formData: FormData, name: string) {
  const raw = formData.get(name);
  return typeof raw === "string" ? raw.trim() : "";
}

function errorMessage(error: unknown, fallback: string) {
  return error && typeof error === "object" && "message" in error &&
    typeof error.message === "string" && error.message.trim()
    ? error.message
    : fallback;
}

export async function reviewDeck(
  _state: DeckReviewActionState,
  formData: FormData,
): Promise<DeckReviewActionState> {
  const deckId = value(formData, "deckId");
  const decision = value(formData, "decision");
  const reviewerNotes = value(formData, "reviewerNotes");
  if (!deckId || !["accepted", "rejected"].includes(decision)) {
    return { message: "Choose a valid deck and decision." };
  }

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub ?? null;
  const { data: profile } = userId
    ? await supabase.from("profiles").select("role").eq("id", userId).maybeSingle()
    : { data: null };
  if (!userId || !hasPermission(profile?.role, "manageCommunityDecks")) {
    return { message: "Only admins and developers can review decks." };
  }

  const accepted = decision === "accepted";
  if (accepted) {
    const { data: deck } = await supabase
      .from("decks")
      .select("description")
      .eq("id", deckId)
      .eq("publication_status", "under_review")
      .maybeSingle();
    if (!deck) return { message: "That deck is no longer awaiting review." };
    if (!deck.description?.trim()) {
      return { message: "A deck must have a description before it can be accepted." };
    }
  }

  const { data, error } = await supabase
    .from("decks")
    .update({
      publication_status: accepted ? "approved" : "rejected",
      visibility: accepted ? "community" : "private",
      review_notes: reviewerNotes || null,
      reviewed_by_user_id: userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", deckId)
    .eq("publication_status", "under_review")
    .select("id")
    .maybeSingle();

  if (error) return { message: errorMessage(error, "Could not review that deck.") };
  if (!data) return { message: "That deck is no longer awaiting review." };

  revalidatePath("/community");
  revalidatePath("/community/review");
  revalidatePath(`/community/review/decks/${deckId}`);
  revalidatePath("/my-stuff/decks");
  return { success: accepted ? "Deck accepted." : "Deck rejected." };
}
