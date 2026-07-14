import Link from "next/link";
import { normalizeLanguagePreferences } from "@/lib/preferences/language";
import { createClient } from "@/lib/supabase/server";
import { getAllJingdexDecks } from "../data";
import { JingdexDeckSearch } from "./deck-search";

export default async function JingdexDecksPage() {
  const supabase = await createClient();
  const [{ data: authData }, deckState] = await Promise.all([
    supabase.auth.getClaims(),
    getAllJingdexDecks(),
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
    <main className="flex-1 bg-background text-foreground">
      <div className="w-full space-y-8">
        <header className="space-y-3">
          <Link className="font-sans text-sm font-bold text-primary hover:text-foreground" href="/community/featured">
            ← Community
          </Link>
          <h1 className="font-heading text-5xl font-semibold leading-none sm:text-6xl">
            Decks by Jingdex
          </h1>
          <p className="max-w-2xl font-sans text-lg text-muted">
            Browse Chinese vocabulary decks created by Jingdex.
          </p>
        </header>

        {deckState.message ? <p className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 font-sans text-sm font-bold text-danger">{deckState.message}</p> : null}

        {deckState.decks.length > 0 ? (
          <JingdexDeckSearch decks={deckState.decks} preferences={preferences} />
        ) : !deckState.message ? (
          <p className="rounded-lg border border-muted-background bg-surface px-5 py-4 font-sans text-sm text-muted">
            No Jingdex decks are available yet.
          </p>
        ) : null}
      </div>
    </main>
  );
}
