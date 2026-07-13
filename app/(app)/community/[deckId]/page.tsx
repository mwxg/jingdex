import Link from "next/link";
import { notFound } from "next/navigation";
import { normalizeLanguagePreferences } from "@/lib/preferences/language";
import { createClient } from "@/lib/supabase/server";
import { getCommunityDeck } from "../data";
import { DeckBrowser } from "./deck-browser";

export default async function CommunityDeckPage({
  params,
}: Readonly<{
  params: Promise<{ deckId: string }>;
}>) {
  const { deckId } = await params;
  const supabase = await createClient();
  const [{ data: authData }, deckState] = await Promise.all([
    supabase.auth.getClaims(),
    getCommunityDeck(deckId),
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

  if (!deckState.deck && !deckState.message) {
    notFound();
  }

  return (
    <main className="flex-1 bg-background text-foreground">
      <div className="w-full space-y-8">
        <Link
          className="inline-flex h-10 items-center rounded-lg border border-muted-background bg-surface px-4 font-sans text-sm font-bold text-foreground transition-colors hover:border-primary hover:text-primary"
          href="/community"
        >
          Back to community
        </Link>

        {deckState.message ? (
          <p className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 font-sans text-sm font-bold text-danger">
            {deckState.message}
          </p>
        ) : null}

        {deckState.deck ? (
          <>
            <header className="space-y-3">
              <p className="font-sans text-sm font-bold uppercase text-primary">
                Community deck
              </p>
              <h1 className="font-heading text-5xl font-semibold leading-none sm:text-6xl">
                {deckState.deck.title}
              </h1>
              <div className="flex flex-col gap-2 font-sans text-sm text-muted sm:flex-row sm:items-center">
                <span>{deckState.deck.term_count} terms</span>
                <span className="hidden sm:inline">/</span>
                <span>By {deckState.deck.created_by || "Jingdex"}</span>
              </div>
              {deckState.deck.description ? (
                <p className="max-w-3xl font-sans text-lg leading-8 text-muted">
                  {deckState.deck.description}
                </p>
              ) : null}
            </header>

            <DeckBrowser deck={deckState.deck} preferences={preferences} />
          </>
        ) : null}
      </div>
    </main>
  );
}
