import { type CommunityDeckDetails, type CommunityTerm } from "@/app/(app)/community/data";
import { createClient } from "@/lib/supabase/server";

type DeckTermRow = {
  position: number;
  terms: CommunityTerm | CommunityTerm[] | null;
};

export type ReviewDeckDetails = CommunityDeckDetails & {
  publication_status: "under_review" | "approved" | "rejected";
  review_notes: string | null;
  submitted_by_user_id: string;
};

export async function getReviewDeck(deckId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("decks")
    .select("id,title,description,created_by,created_by_user_id,created_at,publication_status,review_notes,deck_terms(position,terms(id,simplified,traditional,pinyin,zhuyin,english_definition,short_definition,parts_of_speech,notes,added_by))")
    .eq("id", deckId)
    .in("publication_status", ["under_review", "approved", "rejected"])
    .maybeSingle();

  if (error || !data) return null;
  const terms = ((data.deck_terms ?? []) as DeckTermRow[])
    .sort((left, right) => left.position - right.position)
    .map((row) => Array.isArray(row.terms) ? row.terms[0] ?? null : row.terms)
    .filter((term): term is CommunityTerm => Boolean(term))
    .map((term) => ({ ...term, added_by_display: term.added_by || "Jingdex" }));

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    created_by: data.created_by,
    created_at: data.created_at,
    submitted_by_user_id: data.created_by_user_id,
    publication_status: data.publication_status,
    review_notes: data.review_notes,
    first_term: terms[0] ?? null,
    term_count: terms.length,
    terms,
  } as ReviewDeckDetails;
}
