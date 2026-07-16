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

export type PublicDeckSort = "alphabetical" | "latest" | "oldest";

export const PUBLIC_DECKS_PAGE_SIZE = 30;

type DeckRow = {
  id: string;
  title: string;
  description: string | null;
  created_by: string;
  created_at: string;
};

type DeckTermRow = {
  deck_id?: string;
  position: number;
  terms: CommunityTerm | CommunityTerm[] | null;
};

type DeckSummaryRpcRow = DeckRow & {
  first_term: CommunityTerm | null;
  term_count: number | string;
  total_count?: number | string;
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

function getRpcDeckSummary(row: DeckSummaryRpcRow): CommunityDeckSummary {
  const firstTerm = row.first_term
    ? addAttributionLabels([row.first_term])[0]
    : null;

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    created_by: row.created_by,
    created_at: row.created_at,
    first_term: firstTerm,
    term_count: Number(row.term_count),
  };
}

function isMissingDeckSummaryRpc(error: { message?: string } | null) {
  const message = error?.message?.toLocaleLowerCase() ?? "";
  return message.includes("schema cache") || message.includes("could not find the function");
}

async function getJingdexDeckSummariesLegacy(query = "", randomLimit?: number) {
  const supabase = await createClient();
  const { data: registryRows, error: registryError } = await supabase
    .from("jingdex_decks")
    .select("deck_id");

  if (registryError) {
    return {
      decks: [],
      message: getErrorMessage(
        registryError,
        "Could not load the Jingdex deck list.",
      ),
    };
  }

  const registeredDeckIds = (registryRows ?? []).map(
    ({ deck_id }) => deck_id as string,
  );

  if (registeredDeckIds.length === 0) {
    return { decks: [], message: null };
  }

  const { data: deckRows, error: decksError } = await supabase
    .from("decks")
    .select("id,title,description,created_by,created_at")
    .eq("visibility", "community")
    .eq("publication_status", "approved")
    .in("id", registeredDeckIds);

  if (decksError) {
    return {
      decks: [],
      message: getErrorMessage(decksError, "Could not load community decks."),
    };
  }

  const normalizedQuery = query.trim().normalize("NFC").toLocaleLowerCase();
  let decks = ((deckRows ?? []) as DeckRow[]).filter((deck) =>
    normalizedQuery
      ? deck.title.toLocaleLowerCase().includes(normalizedQuery) ||
        (deck.description ?? "").toLocaleLowerCase().includes(normalizedQuery)
      : true,
  );

  decks = randomLimit
    ? [...decks].sort(() => Math.random() - 0.5).slice(0, randomLimit)
    : [...decks].sort((a, b) => a.title.localeCompare(b.title));

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
    const deckId = row.deck_id;

    if (!term || !deckId) {
      continue;
    }

    const currentTerms = termsByDeckId.get(deckId) ?? [];
    currentTerms.push(term);
    termsByDeckId.set(deckId, currentTerms);
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

async function getJingdexDeckSummaries(query = "", randomLimit?: number) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_jingdex_deck_summaries", {
    search_query: query,
    max_results: randomLimit ?? null,
    randomize: Boolean(randomLimit),
  });

  if (!error) {
    return {
      decks: ((data ?? []) as DeckSummaryRpcRow[]).map(getRpcDeckSummary),
      message: null,
    };
  }

  if (isMissingDeckSummaryRpc(error)) {
    return getJingdexDeckSummariesLegacy(query, randomLimit);
  }

  return {
    decks: [],
    message: getErrorMessage(error, "Could not load community decks."),
  };
}

export async function getCommunityDecks() {
  return getJingdexDeckSummaries("", 3);
}

export async function getRecentTerms() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("terms")
    .select(
      "id,simplified,traditional,pinyin,zhuyin,english_definition,short_definition,parts_of_speech,notes,added_by",
    )
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(50);

  if (error) {
    return {
      terms: [],
      message: getErrorMessage(error, "Could not load recent terms."),
    };
  }

  return {
    terms: addAttributionLabels((data ?? []) as CommunityTerm[]),
    message: null,
  };
}

export async function getAllJingdexDecks(query = "") {
  return getJingdexDeckSummaries(query);
}

async function getPublicDecksLegacy({
  page = 1,
  query = "",
  sort = "alphabetical",
}: {
  page?: number;
  query?: string;
  sort?: PublicDeckSort;
}) {
  const supabase = await createClient();
  const normalizedQuery = query.trim().normalize("NFC");
  const normalizedPage = Math.max(1, Math.floor(page));
  const from = (normalizedPage - 1) * PUBLIC_DECKS_PAGE_SIZE;
  const to = from + PUBLIC_DECKS_PAGE_SIZE - 1;

  let deckQuery = supabase
    .from("decks")
    .select("id,title,description,created_by,created_at", { count: "exact" })
    .eq("visibility", "community")
    .eq("publication_status", "approved");

  if (normalizedQuery) {
    deckQuery = deckQuery.ilike("title", `%${normalizedQuery}%`);
  }

  if (sort === "latest") {
    deckQuery = deckQuery.order("created_at", { ascending: false });
  } else if (sort === "oldest") {
    deckQuery = deckQuery.order("created_at", { ascending: true });
  } else {
    deckQuery = deckQuery.order("title", { ascending: true });
  }

  const { data: deckRows, error: decksError, count } = await deckQuery
    .order("id", { ascending: true })
    .range(from, to);

  if (decksError) {
    return {
      decks: [],
      message: getErrorMessage(decksError, "Could not load public decks."),
      page: normalizedPage,
      totalCount: 0,
      totalPages: 0,
    };
  }

  const decks = (deckRows ?? []) as DeckRow[];
  const totalCount = count ?? 0;
  const totalPages = Math.ceil(totalCount / PUBLIC_DECKS_PAGE_SIZE);

  if (decks.length === 0) {
    return { decks: [], message: null, page: normalizedPage, totalCount, totalPages };
  }

  const { data: termRows, error: termsError } = await supabase
    .from("deck_terms")
    .select(
      "deck_id,position,terms(id,simplified,traditional,pinyin,zhuyin,english_definition,short_definition,parts_of_speech,notes,added_by)",
    )
    .in("deck_id", decks.map((deck) => deck.id))
    .order("position", { ascending: true });

  if (termsError) {
    return {
      decks: [],
      message: getErrorMessage(termsError, "Could not load public deck terms."),
      page: normalizedPage,
      totalCount,
      totalPages,
    };
  }

  const termsByDeckId = new Map<string, CommunityTerm[]>();
  for (const row of ((termRows ?? []) as DeckTermRow[])) {
    const term = getJoinedTerm(row);
    const deckId = row.deck_id;
    if (!term || !deckId) continue;
    const currentTerms = termsByDeckId.get(deckId) ?? [];
    currentTerms.push(term);
    termsByDeckId.set(deckId, currentTerms);
  }

  return {
    decks: decks.map((deck) => {
      const terms = addAttributionLabels(termsByDeckId.get(deck.id) ?? []);
      return { ...deck, first_term: terms[0] ?? null, term_count: terms.length };
    }),
    message: null,
    page: normalizedPage,
    totalCount,
    totalPages,
  };
}

export async function getPublicDecks({
  page = 1,
  query = "",
  sort = "alphabetical",
}: {
  page?: number;
  query?: string;
  sort?: PublicDeckSort;
}) {
  const normalizedPage = Math.max(1, Math.floor(page));
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_deck_summaries", {
    search_query: query.trim().normalize("NFC"),
    sort_order: sort,
    result_offset: (normalizedPage - 1) * PUBLIC_DECKS_PAGE_SIZE,
    result_limit: PUBLIC_DECKS_PAGE_SIZE,
  });

  if (isMissingDeckSummaryRpc(error)) {
    return getPublicDecksLegacy({ page: normalizedPage, query, sort });
  }

  if (error) {
    return {
      decks: [],
      message: getErrorMessage(error, "Could not load public decks."),
      page: normalizedPage,
      totalCount: 0,
      totalPages: 0,
    };
  }

  const rows = (data ?? []) as DeckSummaryRpcRow[];
  const totalCount = rows.length ? Number(rows[0].total_count ?? 0) : 0;

  return {
    decks: rows.map(getRpcDeckSummary),
    message: null,
    page: normalizedPage,
    totalCount,
    totalPages: Math.ceil(totalCount / PUBLIC_DECKS_PAGE_SIZE),
  };
}

export async function getCommunityDeck(deckId: string) {
  const supabase = await createClient();
  const { data: deckRow, error: deckError } = await supabase
    .from("decks")
    .select(
      "id,title,description,created_by,created_at,deck_terms(position,terms(id,simplified,traditional,pinyin,zhuyin,english_definition,short_definition,parts_of_speech,notes,added_by))",
    )
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

  const terms = addAttributionLabels(
    ((deckRow.deck_terms ?? []) as DeckTermRow[])
      .sort((left, right) => left.position - right.position)
      .map(getJoinedTerm)
      .filter((term): term is CommunityTerm => Boolean(term)),
  );

  return {
    deck: {
      id: deckRow.id,
      title: deckRow.title,
      description: deckRow.description,
      created_by: deckRow.created_by,
      created_at: deckRow.created_at,
      first_term: terms[0] ?? null,
      term_count: terms.length,
      terms,
    },
    message: null,
  };
}
