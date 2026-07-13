import { createClient } from "@/lib/supabase/server";
import { type CommunityDeckDetails, type CommunityTerm } from "@/app/(app)/community/data";

type DeckTermRow = {
  position: number;
  terms: CommunityTerm | CommunityTerm[] | null;
};

function joinedTerm(row: DeckTermRow) {
  return Array.isArray(row.terms) ? row.terms[0] ?? null : row.terms;
}

function termsFromRows(rows: DeckTermRow[]) {
  return [...rows]
    .sort((left, right) => left.position - right.position)
    .map(joinedTerm)
    .filter((term): term is CommunityTerm => Boolean(term))
    .map((term) => ({ ...term, added_by_display: term.added_by || "Jingdex" }));
}

const deckSelection = "id,title,description,created_by,created_at,updated_at,deck_terms(position,terms(id,simplified,traditional,pinyin,zhuyin,english_definition,short_definition,parts_of_speech,notes,added_by))";

export type PersonalDeckSummary = Omit<CommunityDeckDetails, "terms"> & {
  updated_at: string;
  terms: CommunityTerm[];
};

export async function getPersonalDecks() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return [];

  const { data } = await supabase.from("decks").select(deckSelection)
    .eq("created_by_user_id", authData.user.id).eq("visibility", "private")
    .order("updated_at", { ascending: false });

  return (data ?? []).map((deck) => {
    const terms = termsFromRows((deck.deck_terms ?? []) as DeckTermRow[]);
    return { ...deck, deck_terms: undefined, first_term: terms[0] ?? null, term_count: terms.length, terms } as PersonalDeckSummary;
  });
}

export async function getPersonalDeck(deckId: string) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return null;

  const { data } = await supabase.from("decks").select(deckSelection)
    .eq("id", deckId).eq("created_by_user_id", authData.user.id)
    .eq("visibility", "private").maybeSingle();
  if (!data) return null;
  const terms = termsFromRows((data.deck_terms ?? []) as DeckTermRow[]);
  return { ...data, deck_terms: undefined, first_term: terms[0] ?? null, term_count: terms.length, terms } as CommunityDeckDetails & { updated_at: string };
}
