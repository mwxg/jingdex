import { createClient } from "@/lib/supabase/server";
import { type PartOfSpeech } from "@/lib/terms/parts-of-speech";

export type CommunityTerm = {
  id: string;
  simplified: string;
  traditional: string | null;
  pinyin: string;
  zhuyin: string;
  english_definition: string | null;
  short_definition: string | null;
  parts_of_speech: PartOfSpeech[] | null;
  notes: string | null;
  added_by: string;
  added_by_display: string;
};

export type CommunityDeckSummary = {
  id: string;
  title: string;
  description: string | null;
  created_by: string;
  created_at: string;
  term_count: number;
  first_term: CommunityTerm | null;
};

export type CommunityDeckDetails = CommunityDeckSummary & {
  terms: CommunityTerm[];
};

type DeckRow = {
  id: string;
  title: string;
  description: string | null;
  created_by: string;
  created_at: string;
};

type DeckTermRow = {
  deck_id: string;
  position: number;
  terms: CommunityTerm | CommunityTerm[] | null;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.trim() &&
    error.message.trim() !== "{}"
  ) {
    return error.message;
  }

  return fallback;
}

function addAttributionLabels(terms: CommunityTerm[]) {
  return terms.map((term) => ({
    ...term,
    added_by_display: term.added_by || "Jingdex",
  }));
}

function getJoinedTerm(row: DeckTermRow) {
  if (Array.isArray(row.terms)) {
    return row.terms[0] ?? null;
  }

  return row.terms;
}

export async function getCommunityDecks() {
  const supabase = await createClient();
  const { data: deckRows, error: decksError } = await supabase
    .from("decks")
    .select("id,title,description,created_by,created_at")
    .eq("visibility", "community")
    .eq("publication_status", "approved")
    .order("created_at", { ascending: false })
    .limit(24);

  if (decksError) {
    return {
      decks: [],
      message: getErrorMessage(decksError, "Could not load community decks."),
    };
  }

  const decks = (deckRows ?? []) as DeckRow[];

  if (decks.length === 0) {
    return { decks: [], message: null };
  }

  const deckIds = decks.map((deck) => deck.id);
  const { data: termRows, error: termsError } = await supabase
    .from("deck_terms")
    .select(
      "deck_id,position,terms(id,simplified,traditional,pinyin,zhuyin,english_definition,short_definition,parts_of_speech,notes,added_by)",
    )
    .in("deck_id", deckIds)
    .order("position", { ascending: true });

  if (termsError) {
    return {
      decks: [],
      message: getErrorMessage(termsError, "Could not load deck terms."),
    };
  }

  const termsByDeckId = new Map<string, CommunityTerm[]>();

  for (const row of ((termRows ?? []) as DeckTermRow[])) {
    const term = getJoinedTerm(row);

    if (!term) {
      continue;
    }

    const currentTerms = termsByDeckId.get(row.deck_id) ?? [];
    currentTerms.push(term);
    termsByDeckId.set(row.deck_id, currentTerms);
  }

  return {
    decks: decks.map((deck) => {
      const terms = addAttributionLabels(termsByDeckId.get(deck.id) ?? []);

      return {
        ...deck,
        first_term: terms[0] ?? null,
        term_count: terms.length,
      };
    }),
    message: null,
  };
}

export async function getCommunityDeck(deckId: string) {
  const supabase = await createClient();
  const { data: deckRow, error: deckError } = await supabase
    .from("decks")
    .select("id,title,description,created_by,created_at")
    .eq("id", deckId)
    .eq("visibility", "community")
    .eq("publication_status", "approved")
    .maybeSingle();

  if (deckError) {
    return {
      deck: null,
      message: getErrorMessage(deckError, "Could not load that deck."),
    };
  }

  if (!deckRow) {
    return { deck: null, message: null };
  }

  const { data: termRows, error: termsError } = await supabase
    .from("deck_terms")
    .select(
      "deck_id,position,terms(id,simplified,traditional,pinyin,zhuyin,english_definition,short_definition,parts_of_speech,notes,added_by)",
    )
    .eq("deck_id", deckRow.id)
    .order("position", { ascending: true });

  if (termsError) {
    return {
      deck: null,
      message: getErrorMessage(termsError, "Could not load deck terms."),
    };
  }

  const terms = addAttributionLabels(
    ((termRows ?? []) as DeckTermRow[])
      .map(getJoinedTerm)
      .filter((term): term is CommunityTerm => Boolean(term)),
  );

  return {
    deck: {
      ...(deckRow as DeckRow),
      first_term: terms[0] ?? null,
      term_count: terms.length,
      terms,
    },
    message: null,
  };
}
