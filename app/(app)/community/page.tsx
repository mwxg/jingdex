import Link from "next/link";
import {
  getChineseDisplayForms,
  normalizeLanguagePreferences,
  type LanguagePreferences,
} from "@/lib/preferences/language";
import { createClient } from "@/lib/supabase/server";
import { getCommunityDecks, type CommunityDeckSummary } from "./data";

function getPronunciationLabel(
  term: CommunityDeckSummary["first_term"],
  preferences: LanguagePreferences,
) {
  if (!term) {
    return "No terms yet";
  }

  return preferences.pronunciation === "zhuyin" ? term.zhuyin : term.pinyin;
}

function CommunityDeckCard({
  deck,
  preferences,
}: Readonly<{
  deck: CommunityDeckSummary;
  preferences: LanguagePreferences;
}>) {
  const forms = deck.first_term
    ? getChineseDisplayForms(deck.first_term, preferences.characterSet)
    : null;

  return (
    <li className="w-[18rem] shrink-0 sm:w-[22rem]">
      <Link
        className="block h-full rounded-lg border border-muted-background bg-surface p-5 transition-colors hover:border-primary focus:border-primary focus:outline-none"
        href={`/community/${deck.id}`}
      >
        <div className="flex min-h-40 items-center justify-center rounded-lg bg-muted-background px-4 py-6">
          {forms ? (
            <div className="text-center">
              <p className="font-chinese text-6xl font-bold leading-none text-foreground sm:text-7xl">
                {forms.primary}
              </p>
              {forms.secondary ? (
                <p className="mt-3 font-chinese text-xl text-muted">
                  {forms.secondary}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="font-sans text-sm font-bold text-muted">
              Empty deck
            </p>
          )}
        </div>

        <div className="mt-5 space-y-3">
          <div>
            <h2 className="line-clamp-2 font-heading text-2xl font-semibold leading-tight text-foreground">
              {deck.title}
            </h2>
            <p className="mt-1 font-sans text-sm font-bold text-primary">
              {getPronunciationLabel(deck.first_term, preferences)}
            </p>
          </div>
          <p className="line-clamp-3 min-h-18 font-sans text-sm leading-6 text-muted">
            {deck.description || "No description added."}
          </p>
          <div className="flex items-center justify-between gap-3 border-t border-muted-background pt-3 font-sans text-sm text-muted">
            <span>{deck.term_count} terms</span>
            <span className="truncate">By {deck.created_by || "Jingdex"}</span>
          </div>
        </div>
      </Link>
    </li>
  );
}

export default async function CommunityPage() {
  const supabase = await createClient();
  const [{ data: authData }, deckState] = await Promise.all([
    supabase.auth.getClaims(),
    getCommunityDecks(),
  ]);
  const userId = authData?.claims?.sub ?? null;
  const { data: profile } = userId
    ? await supabase
        .from("profiles")
        .select("preferred_character_set,preferred_pronunciation")
        .eq("id", userId)
        .maybeSingle()
    : { data: null };
  const preferences = normalizeLanguagePreferences(profile);

  return (
    <main className="flex-1 bg-background px-6 py-10 text-foreground">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="space-y-3">
          <p className="font-sans text-sm font-bold uppercase text-primary">
            Community
          </p>
          <h1 className="font-heading text-5xl font-semibold leading-none sm:text-6xl">
            Community decks
          </h1>
          <h3 className="font-heading text-3xl font-semibold leading-none text-muted">
            Browse shared Chinese vocabulary sets from Jingdex.
          </h3>
        </header>

        {deckState.message ? (
          <p className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 font-sans text-sm font-bold text-danger">
            {deckState.message}
          </p>
        ) : null}

        {deckState.decks.length > 0 ? (
          <section
            aria-labelledby="community-decks-title"
            className="rounded-lg border border-muted-background bg-surface p-4 sm:p-6"
          >
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <h2
                className="font-heading text-2xl font-semibold text-foreground"
                id="community-decks-title"
              >
                All decks
              </h2>
              <p className="font-sans text-sm text-muted">
                Scroll sideways to browse.
              </p>
            </div>
            <ul className="flex gap-4 overflow-x-auto pb-3">
              {deckState.decks.map((deck) => (
                <CommunityDeckCard
                  deck={deck}
                  key={deck.id}
                  preferences={preferences}
                />
              ))}
            </ul>
          </section>
        ) : !deckState.message ? (
          <p className="rounded-lg border border-muted-background bg-surface px-5 py-4 font-sans text-sm text-muted">
            No community decks are available yet.
          </p>
        ) : null}
      </div>
    </main>
  );
}
